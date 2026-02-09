// backend-ts/src/alert/alert.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertConfig } from './alert-config.entity';
import axios from 'axios';

export interface AlertConfigDto {
  telegramBotToken?: string;
  telegramChatId?: string;
  tlsAlertDays?: number;
  domainAlertDays?: number;
  enabled?: boolean;
}

interface ExpiryItem {
  domain: string;
  type: 'TLS' | 'WHOIS';
  daysLeft: number;
}

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    @InjectRepository(AlertConfig)
    private configRepo: Repository<AlertConfig>,
  ) {}

  private parseChatId(raw: string): { chat_id: string; message_thread_id?: number } {
    const parts = raw.split(':');
    if (parts.length === 2 && parts[1].trim()) {
      return { chat_id: parts[0].trim(), message_thread_id: parseInt(parts[1].trim(), 10) };
    }
    return { chat_id: raw.trim() };
  }

  async getConfig(): Promise<AlertConfig> {
    let config = await this.configRepo.findOne({ where: {} });
    if (!config) {
      config = this.configRepo.create({
        telegramBotToken: '',
        telegramChatId: '',
        tlsAlertDays: 14,
        domainAlertDays: 30,
        enabled: false,
      });
      config = await this.configRepo.save(config);
    }
    return config;
  }

  async updateConfig(dto: AlertConfigDto): Promise<AlertConfig> {
    let config = await this.getConfig();
    Object.assign(config, dto);
    return this.configRepo.save(config);
  }

  async sendTelegramAlert(items: ExpiryItem[]): Promise<void> {
    const config = await this.getConfig();
    if (!config.enabled || !config.telegramBotToken || !config.telegramChatId) {
      this.logger.log('Telegram 告警未啟用或未設定，跳過發送。');
      return;
    }
    if (items.length === 0) return;

    const tlsItems = items.filter(i => i.type === 'TLS');
    const whoisItems = items.filter(i => i.type === 'WHOIS');

    let message = '🚨 <b>網站監控告警</b> 🚨\n\n';

    if (tlsItems.length > 0) {
      message += '🔐 <b>TLS 證書即將到期</b>\n';
      for (const item of tlsItems) {
        const emoji = item.daysLeft <= 3 ? '🔴' : item.daysLeft <= 7 ? '🟠' : '🟡';
        message += `  ${emoji} <code>${item.domain}</code> — 剩餘 <b>${item.daysLeft}</b> 天\n`;
      }
      message += '\n';
    }

    if (whoisItems.length > 0) {
      message += '🌐 <b>域名即將到期</b>\n';
      for (const item of whoisItems) {
        const emoji = item.daysLeft <= 7 ? '🔴' : item.daysLeft <= 14 ? '🟠' : '🟡';
        message += `  ${emoji} <code>${item.domain}</code> — 剩餘 <b>${item.daysLeft}</b> 天\n`;
      }
      message += '\n';
    }

    message += `⏰ 告警時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}\n`;
    message += `📋 共 ${items.length} 項需要關注`;

    const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
    const { chat_id, message_thread_id } = this.parseChatId(config.telegramChatId);
    try {
      await axios.post(url, {
        chat_id,
        text: message,
        parse_mode: 'HTML',
        ...(message_thread_id ? { message_thread_id } : {}),
      });
      this.logger.log(`Telegram 告警已發送，共 ${items.length} 項。`);
    } catch (err: any) {
      this.logger.error(`Telegram 發送失敗: ${err.message}`);
    }
  }

  async sendFailureAlert(items: { domain: string; failures: number; threshold: number }[]): Promise<void> {
    const config = await this.getConfig();
    if (!config.enabled || !config.telegramBotToken || !config.telegramChatId) {
      return;
    }
    if (items.length === 0) return;

    let message = '🔥 <b>連續失敗告警</b> 🔥\n\n';
    for (const item of items) {
      const emoji = item.failures >= item.threshold * 2 ? '🔴' : '🟠';
      message += `  ${emoji} <code>${item.domain}</code> — 連續失敗 <b>${item.failures}</b> 次（門檻 ${item.threshold}）\n`;
    }
    message += `\n⏰ 告警時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}\n`;
    message += `⚠️ 共 ${items.length} 個域名連續失敗`;

    const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
    const { chat_id, message_thread_id } = this.parseChatId(config.telegramChatId);
    try {
      await axios.post(url, {
        chat_id,
        text: message,
        parse_mode: 'HTML',
        ...(message_thread_id ? { message_thread_id } : {}),
      });
      this.logger.log(`Telegram 連續失敗告警已發送，共 ${items.length} 項。`);
    } catch (err: any) {
      this.logger.error(`Telegram 發送失敗: ${err.message}`);
    }
  }

  async testTelegram(): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfig();
    if (!config.telegramBotToken || !config.telegramChatId) {
      return { success: false, message: 'Bot Token 或 Chat ID 未設定' };
    }

    const testMsg = '✅ <b>測試訊息</b>\n\n🖥 網站監控系統 Telegram 告警連線測試成功！\n\n⏰ ' +
      new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

    const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
    const { chat_id, message_thread_id } = this.parseChatId(config.telegramChatId);
    try {
      await axios.post(url, {
        chat_id,
        text: testMsg,
        parse_mode: 'HTML',
        ...(message_thread_id ? { message_thread_id } : {}),
      });
      return { success: true, message: '測試訊息發送成功' };
    } catch (err: any) {
      return { success: false, message: `發送失敗: ${err.response?.data?.description || err.message}` };
    }
  }
}
