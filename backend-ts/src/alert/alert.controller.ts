// backend-ts/src/alert/alert.controller.ts
import { Controller, Get, Put, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AlertService, AlertConfigDto } from './alert.service';
import { AlertConfig } from './alert-config.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { AuditService } from '../audit/audit.service';

@Controller('alert')
@UseGuards(JwtAuthGuard)
export class AlertController {
  constructor(
    private readonly alertService: AlertService,
    private readonly auditService: AuditService,
  ) {}

  @Get('config')
  getConfig(): Promise<AlertConfig> {
    return this.alertService.getConfig();
  }

  @Put('config')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateConfig(@Request() req: any, @Body() dto: AlertConfigDto): Promise<AlertConfig> {
    const result = await this.alertService.updateConfig(dto);
    await this.auditService.log(req.user.id, req.user.username, 'update_alert_config', undefined, JSON.stringify(dto));
    return result;
  }

  @Post('test')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async testTelegram(@Request() req: any): Promise<{ success: boolean; message: string }> {
    const result = await this.alertService.testTelegram();
    await this.auditService.log(req.user.id, req.user.username, 'test_telegram', undefined, result.message);
    return result;
  }
}
