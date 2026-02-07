// backend-ts/src/retention/retention.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetentionConfig } from './retention-config.entity';
import { AuditLog } from '../audit/audit-log.entity';
import { SiteCheckResult } from '../site/site-check-result.entity';
import { RetentionService } from './retention.service';
import { RetentionController } from './retention.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RetentionConfig, AuditLog, SiteCheckResult]),
    AuditModule,
  ],
  controllers: [RetentionController],
  providers: [RetentionService],
  exports: [RetentionService],
})
export class RetentionModule {}
