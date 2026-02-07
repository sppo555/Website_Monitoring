// backend-ts/src/checker/checker.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from '../site/site.entity';
import { SiteCheckResult } from '../site/site-check-result.entity';
import { AlertService } from '../alert/alert.service';
import axios from 'axios';
import * as tls from 'tls';

interface ExpiryItem {
  domain: string;
  type: 'TLS' | 'WHOIS';
  daysLeft: number;
}

interface FailureAlertItem {
  domain: string;
  failures: number;
  threshold: number;
}

// 批量設定：每批幾個、批次間延遲 ms
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 2000;

@Injectable()
export class CheckerService {
  private readonly logger = new Logger(CheckerService.name);

  constructor(
    @InjectRepository(SiteCheckResult)
    private checkResultRepository: Repository<SiteCheckResult>,
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
    private readonly alertService: AlertService,
  ) {}

  /**
   * 對所有傳入的網站執行批量檢查
   * - 按 BATCH_SIZE 分批，批次間延遲 BATCH_DELAY_MS
   * - HTTP/HTTPS 根據 httpCheckIntervalSeconds 判斷是否到期
   * - TLS 根據 tlsCheckIntervalDays 判斷
   * - WHOIS 根據 domainCheckIntervalDays 判斷
   */
  async checkAll(sites: Site[]): Promise<void> {
    const expiryAlerts: ExpiryItem[] = [];
    const failureAlerts: FailureAlertItem[] = [];

    // 分批處理
    for (let i = 0; i < sites.length; i += BATCH_SIZE) {
      const batch = sites.slice(i, i + BATCH_SIZE);
      this.logger.log(`處理第 ${Math.floor(i / BATCH_SIZE) + 1} 批，共 ${batch.length} 個網站`);

      const promises = batch.map(site => this.checkSite(site, expiryAlerts, failureAlerts));
      await Promise.allSettled(promises);

      // 批次間延遲，避免瞬間大量請求
      if (i + BATCH_SIZE < sites.length) {
        await this.delay(BATCH_DELAY_MS);
      }
    }

    // 合併所有告警一次發送
    await this.sendCombinedAlerts(expiryAlerts, failureAlerts);
  }

  private async checkSite(
    site: Site,
    expiryAlerts: ExpiryItem[],
    failureAlerts: FailureAlertItem[],
  ): Promise<void> {
    const now = new Date();
    const result = new SiteCheckResult();
    result.siteId = site.id;
    result.isHealthy = true;
    let httpFailed = false;

    // === HTTP/HTTPS 檢查（按秒間隔） ===
    const needHttpCheck = (site.checkHttp || site.checkHttps) && this.isHttpDue(site, now);
    if (needHttpCheck) {
      if (site.checkHttp) {
        try {
          const httpStatus = await this.checkHttpRequest(`http://${site.domain}`);
          result.httpStatus = httpStatus;
          if (httpStatus >= 400) { result.isHealthy = false; httpFailed = true; }
        } catch (err: any) {
          result.isHealthy = false;
          httpFailed = true;
          result.errorDetails = (result.errorDetails || '') + `HTTP Error: ${err.message}; `;
        }
      }

      if (site.checkHttps) {
        try {
          const httpsStatus = await this.checkHttpRequest(`https://${site.domain}`);
          if (result.httpStatus === null) result.httpStatus = httpsStatus;
          if (httpsStatus >= 400) { result.isHealthy = false; httpFailed = true; }
        } catch (err: any) {
          result.isHealthy = false;
          httpFailed = true;
          result.errorDetails = (result.errorDetails || '') + `HTTPS Error: ${err.message}; `;
        }
      }

      // 更新 lastHttpCheck
      site.lastHttpCheck = now;

      // 失敗計數
      if (httpFailed) {
        site.consecutiveFailures += 1;
        if (site.consecutiveFailures >= site.failureThreshold) {
          failureAlerts.push({
            domain: site.domain,
            failures: site.consecutiveFailures,
            threshold: site.failureThreshold,
          });
        }
      } else {
        site.consecutiveFailures = 0;
      }
    }

    // === TLS 檢查（按天間隔） ===
    const needTlsCheck = (site.checkTls || site.checkHttps) && this.isTlsDue(site, now);
    if (needTlsCheck) {
      try {
        result.tlsDaysLeft = await this.checkTls(site.domain);
        const config = await this.alertService.getConfig();
        if (result.tlsDaysLeft !== null && result.tlsDaysLeft < config.tlsAlertDays) {
          expiryAlerts.push({ domain: site.domain, type: 'TLS', daysLeft: result.tlsDaysLeft });
        }
        if (result.tlsDaysLeft !== null && result.tlsDaysLeft < 7) {
          result.isHealthy = false;
        }
      } catch (err: any) {
        result.errorDetails = (result.errorDetails || '') + `TLS Error: ${err.message}; `;
      }
      site.lastTlsCheck = now;
    }

    // === WHOIS 檢查（按天間隔） ===
    const needWhoisCheck = site.checkWhois && this.isWhoisDue(site, now);
    if (needWhoisCheck) {
      try {
        result.domainDaysLeft = await this.checkWhois(site.domain);
        const config = await this.alertService.getConfig();
        if (result.domainDaysLeft !== null && result.domainDaysLeft < config.domainAlertDays) {
          expiryAlerts.push({ domain: site.domain, type: 'WHOIS', daysLeft: result.domainDaysLeft });
        }
        if (result.domainDaysLeft !== null && result.domainDaysLeft < 30) {
          result.isHealthy = false;
        }
      } catch (err: any) {
        result.errorDetails = (result.errorDetails || '') + `WHOIS Error: ${err.message}; `;
      }
      site.lastWhoisCheck = now;
    }

    // 只有真正執行了檢查才存結果和更新 site
    if (needHttpCheck || needTlsCheck || needWhoisCheck) {
      // Carry forward：若本次未檢查 TLS/WHOIS，帶入上次已知的值
      if (!needTlsCheck || !needWhoisCheck) {
        const prev = await this.checkResultRepository.findOne({
          where: { siteId: site.id },
          order: { checkedAt: 'DESC' },
        });
        if (prev) {
          if (!needTlsCheck && prev.tlsDaysLeft !== null) {
            result.tlsDaysLeft = prev.tlsDaysLeft;
          }
          if (!needWhoisCheck && prev.domainDaysLeft !== null) {
            result.domainDaysLeft = prev.domainDaysLeft;
          }
        }
      }
      await this.checkResultRepository.save(result);
      await this.siteRepository.save(site);
      this.logger.log(`檢查完成: ${site.domain} - 健康: ${result.isHealthy}`);
    }
  }

  /**
   * 立即對單一網站執行完整檢查（HTTP + TLS + WHOIS），用於新增網站時
   */
  async checkSingleSite(site: Site): Promise<void> {
    const now = new Date();
    const result = new SiteCheckResult();
    result.siteId = site.id;
    result.isHealthy = true;

    // HTTP/HTTPS
    if (site.checkHttp || site.checkHttps) {
      if (site.checkHttp) {
        try {
          const httpStatus = await this.checkHttpRequest(`http://${site.domain}`);
          result.httpStatus = httpStatus;
          if (httpStatus >= 400) result.isHealthy = false;
        } catch (err: any) {
          result.isHealthy = false;
          result.errorDetails = (result.errorDetails || '') + `HTTP Error: ${err.message}; `;
        }
      }
      if (site.checkHttps) {
        try {
          const httpsStatus = await this.checkHttpRequest(`https://${site.domain}`);
          if (result.httpStatus === null) result.httpStatus = httpsStatus;
          if (httpsStatus >= 400) result.isHealthy = false;
        } catch (err: any) {
          result.isHealthy = false;
          result.errorDetails = (result.errorDetails || '') + `HTTPS Error: ${err.message}; `;
        }
      }
      site.lastHttpCheck = now;
    }

    // TLS
    if (site.checkTls || site.checkHttps) {
      try {
        result.tlsDaysLeft = await this.checkTls(site.domain);
        if (result.tlsDaysLeft !== null && result.tlsDaysLeft < 7) result.isHealthy = false;
      } catch (err: any) {
        result.errorDetails = (result.errorDetails || '') + `TLS Error: ${err.message}; `;
      }
      site.lastTlsCheck = now;
    }

    // WHOIS
    if (site.checkWhois) {
      try {
        result.domainDaysLeft = await this.checkWhois(site.domain);
        if (result.domainDaysLeft !== null && result.domainDaysLeft < 30) result.isHealthy = false;
      } catch (err: any) {
        result.errorDetails = (result.errorDetails || '') + `WHOIS Error: ${err.message}; `;
      }
      site.lastWhoisCheck = now;
    }

    await this.checkResultRepository.save(result);
    await this.siteRepository.save(site);
    this.logger.log(`即時檢查完成: ${site.domain} - 健康: ${result.isHealthy}`);
  }

  // === 間隔判斷 ===

  private isHttpDue(site: Site, now: Date): boolean {
    if (!site.lastHttpCheck) return true;
    const elapsed = (now.getTime() - new Date(site.lastHttpCheck).getTime()) / 1000;
    return elapsed >= site.httpCheckIntervalSeconds;
  }

  private isTlsDue(site: Site, now: Date): boolean {
    if (!site.lastTlsCheck) return true;
    const elapsed = (now.getTime() - new Date(site.lastTlsCheck).getTime()) / (1000 * 60 * 60 * 24);
    return elapsed >= site.tlsCheckIntervalDays;
  }

  private isWhoisDue(site: Site, now: Date): boolean {
    if (!site.lastWhoisCheck) return true;
    const elapsed = (now.getTime() - new Date(site.lastWhoisCheck).getTime()) / (1000 * 60 * 60 * 24);
    return elapsed >= site.domainCheckIntervalDays;
  }

  // === 合併告警 ===

  private async sendCombinedAlerts(expiryAlerts: ExpiryItem[], failureAlerts: FailureAlertItem[]): Promise<void> {
    if (expiryAlerts.length === 0 && failureAlerts.length === 0) return;

    // 到期告警
    if (expiryAlerts.length > 0) {
      await this.alertService.sendTelegramAlert(expiryAlerts);
    }

    // 連續失敗告警
    if (failureAlerts.length > 0) {
      await this.alertService.sendFailureAlert(failureAlerts);
    }
  }

  // === 工具方法 ===

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async checkHttpRequest(fullUrl: string): Promise<number> {
    const response = await axios.get(fullUrl, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: () => true,
    });
    return response.status;
  }

  private checkTls(domain: string): Promise<number | null> {
    const hostname = domain.replace(/^www\./, '').split('/')[0];
    return new Promise((resolve, reject) => {
      try {
        const socket = tls.connect(443, hostname, { servername: hostname }, () => {
          const cert = socket.getPeerCertificate();
          if (cert && cert.valid_to) {
            const expiryDate = new Date(cert.valid_to);
            const now = new Date();
            const daysLeft = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            socket.end();
            resolve(daysLeft);
          } else {
            socket.end();
            resolve(null);
          }
        });

        socket.on('error', (err) => {
          reject(err);
        });

        socket.setTimeout(10000, () => {
          socket.destroy();
          reject(new Error('TLS connection timeout'));
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  private async checkWhois(domain: string): Promise<number | null> {
    try {
      const whois = await import('whois-json');
      const cleanDomain = domain.replace(/^www\./, '').split('/')[0];

      const whoisData = await whois.default(cleanDomain);

      const expiryDateStr =
        whoisData.registrarRegistrationExpirationDate ||
        whoisData.registryExpiryDate ||
        whoisData.expirationDate;

      if (expiryDateStr) {
        const expiryDate = new Date(expiryDateStr);
        const now = new Date();
        return Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
      return null;
    } catch (err) {
      throw err;
    }
  }
}
