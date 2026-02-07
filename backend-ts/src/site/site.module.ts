// backend-ts/src/site/site.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Site } from './site.entity';
import { SiteCheckResult } from './site-check-result.entity';
import { Group } from '../group/group.entity';
import { SiteService } from './site.service';
import { SiteController } from './site.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Site, SiteCheckResult, Group]),
    AuditModule,
  ],
  controllers: [SiteController],
  providers: [SiteService],
  exports: [TypeOrmModule, SiteService],
})
export class SiteModule {}