// backend-ts/src/checker/checker.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Site } from '../site/site.entity';
import { SiteCheckResult } from '../site/site-check-result.entity';
import { AlertModule } from '../alert/alert.module';
import { CheckerService } from './checker.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Site, SiteCheckResult]),
    AlertModule,
  ],
  providers: [CheckerService],
  exports: [CheckerService],
})
export class CheckerModule {}
