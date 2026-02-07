// backend-ts/src/scheduler/schedule.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SiteService } from '../site/site.service';
import { CheckerService } from '../checker/checker.service';
import { Site } from '../site/site.entity';

@Injectable()
export class MonitoringScheduler {
  private readonly logger = new Logger(MonitoringScheduler.name);

  constructor(
    private readonly siteService: SiteService,
    private readonly checkerService: CheckerService,
  ) {}

  /**
   * CRON 排程：每分鐘執行一次檢查任務
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.log('排程器啟動：執行所有活動網站的檢查');
    
    // 1. 獲取所有處於 'active' 狀態的網站
    const activeSites = await this.siteService.findAll(); 
    const sitesToCheck = activeSites.filter(site => site.status === 'active');

    if (sitesToCheck.length === 0) {
        this.logger.log('沒有活動網站需要檢查。');
        return;
    }

    // 2. 將任務委託給 CheckerService
    await this.checkerService.checkAll(sitesToCheck);
    this.logger.log(`成功委託 ${sitesToCheck.length} 個網站的檢查任務。`);
  }
}