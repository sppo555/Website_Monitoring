// backend-ts/src/site/site.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Site } from './site.entity';
import { SiteCheckResult } from './site-check-result.entity';
import { SiteService } from './site.service';
import { SiteController } from './site.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Site, SiteCheckResult]),
  ],
  controllers: [SiteController],
  providers: [SiteService],
  exports: [TypeOrmModule, SiteService], // 導出 SiteService 供 CheckerService 使用
})
export class SiteModule {}