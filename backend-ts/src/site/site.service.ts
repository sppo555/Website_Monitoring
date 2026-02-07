// backend-ts/src/site/site.service.ts
import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Site } from './site.entity';
import { SiteCheckResult } from './site-check-result.entity';
import { Group } from '../group/group.entity';

// DTO for Site creation/update
export interface SiteDto {
  domain: string;
  checkHttp?: boolean;
  checkHttps?: boolean;
  checkTls?: boolean;
  checkWhois?: boolean;
  httpCheckIntervalSeconds?: number;
  tlsCheckIntervalDays?: number;
  domainCheckIntervalDays?: number;
  failureThreshold?: number;
  groupIds?: string[];
}

// DTO for batch import
export interface BatchImportDto {
  groupIds?: string[];
  sites: SiteDto[];
}

// DTO for bulk update
export interface BulkUpdateDto {
  siteIds: string[];
  checkHttp?: boolean;
  checkHttps?: boolean;
  checkTls?: boolean;
  checkWhois?: boolean;
  httpCheckIntervalSeconds?: number;
  tlsCheckIntervalDays?: number;
  domainCheckIntervalDays?: number;
  failureThreshold?: number;
  groupIds?: string[];
}

@Injectable()
export class SiteService implements OnModuleInit {
  private readonly logger = new Logger(SiteService.name);

  constructor(
    @InjectRepository(Site)
    private sitesRepository: Repository<Site>,
    @InjectRepository(SiteCheckResult)
    private checkResultRepository: Repository<SiteCheckResult>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
  ) {}

  // 首次啟動自動建立預設監控域名
  async onModuleInit() {
    const count = await this.sitesRepository.count();
    if (count === 0) {
      const seedDomains = ['www.google.com', 'github.com'];
      for (const domain of seedDomains) {
        const site = this.sitesRepository.create({
          domain,
          checkHttp: true,
          checkHttps: true,
          checkTls: true,
          checkWhois: true,
          httpCheckIntervalSeconds: 300,
          tlsCheckIntervalDays: 1,
          domainCheckIntervalDays: 1,
          failureThreshold: 3,
          groups: [],
        });
        await this.sitesRepository.save(site);
      }
      this.logger.log(`已建立預設監控域名: ${seedDomains.join(', ')}`);
    }
  }

  private async resolveGroups(groupIds?: string[]): Promise<Group[]> {
    if (!groupIds || groupIds.length === 0) return [];
    return this.groupRepository.find({ where: { id: In(groupIds) } });
  }

  private stripProtocol(domain: string): string {
    return domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  }

  private validateDomainFormat(domain: string): void {
    if (!domain) throw new BadRequestException('域名不可為空');
    if (/[^a-zA-Z0-9.\-]/.test(domain)) {
      throw new BadRequestException(`域名 "${domain}" 格式錯誤：僅允許英文字母、數字、連字號 (-) 和點 (.)`);
    }
    if (!domain.includes('.')) {
      throw new BadRequestException(`域名 "${domain}" 格式錯誤：必須包含至少一個點 (.)`);
    }
    const labels = domain.split('.');
    for (const label of labels) {
      if (label.length === 0) throw new BadRequestException(`域名 "${domain}" 格式錯誤：不可有連續的點 (..)`);
      if (label.startsWith('-') || label.endsWith('-')) {
        throw new BadRequestException(`域名 "${domain}" 格式錯誤：不可以連字號開頭或結尾`);
      }
      if (label.length > 63) throw new BadRequestException(`域名 "${domain}" 格式錯誤：每段最多 63 字元`);
    }
    if (domain.length > 253) throw new BadRequestException(`域名 "${domain}" 格式錯誤：總長度不可超過 253 字元`);
  }

  async create(siteDto: SiteDto): Promise<any> {
    siteDto.domain = this.stripProtocol(siteDto.domain).trim();
    this.validateDomainFormat(siteDto.domain);
    const existing = await this.sitesRepository.findOne({ where: { domain: siteDto.domain } });
    if (existing) {
      throw new BadRequestException(`域名 ${siteDto.domain} 已存在`);
    }
    const { groupIds, ...rest } = siteDto;
    const groups = await this.resolveGroups(groupIds);
    const newSite = this.sitesRepository.create({ ...rest, groups });
    const saved = await this.sitesRepository.save(newSite);
    return this.findOneWithGroups(saved.id);
  }

  async batchCreate(dto: BatchImportDto): Promise<any[]> {
    // 自動去除 http:// https:// 前綴 + 格式驗證
    for (const s of dto.sites) {
      s.domain = this.stripProtocol(s.domain).trim();
      this.validateDomainFormat(s.domain);
    }
    const domains = dto.sites.map(s => s.domain);
    const uniqueDomains = new Set(domains);
    if (uniqueDomains.size !== domains.length) {
      throw new BadRequestException('批量匯入中有重複的域名');
    }

    const existingSites = await this.sitesRepository
      .createQueryBuilder('s')
      .where('s.domain IN (:...domains)', { domains })
      .getMany();
    if (existingSites.length > 0) {
      const dupes = existingSites.map(s => s.domain).join(', ');
      throw new BadRequestException(`以下域名已存在: ${dupes}`);
    }

    const results: any[] = [];
    for (const s of dto.sites) {
      const { groupIds: sGroupIds, ...rest } = s;
      const ids = sGroupIds || dto.groupIds || [];
      const groups = await this.resolveGroups(ids);
      const entity = this.sitesRepository.create({ ...rest, groups });
      const saved = await this.sitesRepository.save(entity);
      results.push(saved);
    }
    return results;
  }

  async findAll(): Promise<any[]> {
    const sites = await this.sitesRepository.find({ relations: ['groups'] });

    const results = await Promise.all(
      sites.map(async (site) => {
        const latestResult = await this.checkResultRepository.findOne({
          where: { siteId: site.id },
          order: { checkedAt: 'DESC' },
        });
        return { ...site, latestResult };
      }),
    );
    return results;
  }

  async findOne(id: string): Promise<Site> {
    const site = await this.sitesRepository.findOne({ where: { id }, relations: ['groups'] });
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }
    return site;
  }

  private async findOneWithGroups(id: string): Promise<Site> {
    return this.findOne(id);
  }

  async update(id: string, siteDto: SiteDto): Promise<Site> {
    const site = await this.findOne(id);
    const { groupIds, ...rest } = siteDto;
    Object.assign(site, rest);
    if (groupIds !== undefined) {
      site.groups = await this.resolveGroups(groupIds);
    }
    await this.sitesRepository.save(site);
    return this.findOne(id);
  }

  async bulkUpdate(dto: BulkUpdateDto): Promise<Site[]> {
    const { siteIds, groupIds, ...updates } = dto;
    if (!siteIds || siteIds.length === 0) {
      throw new BadRequestException('siteIds is required');
    }
    const sites = await this.sitesRepository.find({ where: { id: In(siteIds) }, relations: ['groups'] });
    const groups = groupIds !== undefined ? await this.resolveGroups(groupIds) : undefined;
    for (const site of sites) {
      Object.assign(site, updates);
      if (groups !== undefined) {
        site.groups = groups;
      }
    }
    await this.sitesRepository.save(sites);
    return sites;
  }

  async updateStatus(id: string, status: 'active' | 'paused'): Promise<Site> {
    if (status !== 'active' && status !== 'paused') {
        throw new BadRequestException('Status must be active or paused'); 
    }
    await this.sitesRepository.update(id, { status });
    return this.findOne(id);
  }

  async getHistory(id: string, hours: number = 24): Promise<SiteCheckResult[]> {
    await this.findOne(id);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.checkResultRepository
      .createQueryBuilder('r')
      .where('r.siteId = :id', { id })
      .andWhere('r.checkedAt >= :since', { since })
      .orderBy('r.checkedAt', 'DESC')
      .getMany();
  }

  async remove(id: string): Promise<void> {
    const site = await this.sitesRepository.findOne({ where: { id } });
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }
    await this.checkResultRepository.delete({ site: { id } });
    await this.sitesRepository.delete(id);
  }
}