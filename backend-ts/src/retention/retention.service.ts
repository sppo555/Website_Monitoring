// backend-ts/src/retention/retention.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { RetentionConfig } from './retention-config.entity';
import { AuditLog } from '../audit/audit-log.entity';
import { SiteCheckResult } from '../site/site-check-result.entity';

export interface RetentionConfigDto {
  auditLogEnabled?: boolean;
  auditLogRetentionDays?: number;
  checkResultEnabled?: boolean;
  checkResultRetentionDays?: number;
}

@Injectable()
export class RetentionService implements OnModuleInit {
  private readonly logger = new Logger(RetentionService.name);

  constructor(
    @InjectRepository(RetentionConfig)
    private configRepo: Repository<RetentionConfig>,
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
    @InjectRepository(SiteCheckResult)
    private checkResultRepo: Repository<SiteCheckResult>,
  ) {}

  async onModuleInit() {
    const count = await this.configRepo.count();
    if (count === 0) {
      await this.configRepo.save(this.configRepo.create());
      this.logger.log('已建立預設 Retention 設定');
    }
  }

  async getConfig(): Promise<RetentionConfig> {
    const configs = await this.configRepo.find();
    return configs[0];
  }

  async updateConfig(dto: RetentionConfigDto): Promise<RetentionConfig> {
    const config = await this.getConfig();
    Object.assign(config, dto);
    return this.configRepo.save(config);
  }

  // 每天凌晨 3:00 執行清理
  @Cron('0 3 * * *')
  async handleRetentionCleanup() {
    const config = await this.getConfig();
    if (!config) return;

    if (config.auditLogEnabled && config.auditLogRetentionDays > 0) {
      const cutoff = new Date(Date.now() - config.auditLogRetentionDays * 24 * 60 * 60 * 1000);
      const result = await this.auditLogRepo
        .createQueryBuilder()
        .delete()
        .where('createdAt < :cutoff', { cutoff })
        .execute();
      this.logger.log(`清理操作紀錄: 刪除 ${result.affected} 筆（保留 ${config.auditLogRetentionDays} 天）`);
    }

    if (config.checkResultEnabled && config.checkResultRetentionDays > 0) {
      const cutoff = new Date(Date.now() - config.checkResultRetentionDays * 24 * 60 * 60 * 1000);
      const result = await this.checkResultRepo
        .createQueryBuilder()
        .delete()
        .where('checkedAt < :cutoff', { cutoff })
        .execute();
      this.logger.log(`清理監控紀錄: 刪除 ${result.affected} 筆（保留 ${config.checkResultRetentionDays} 天）`);
    }
  }
}
