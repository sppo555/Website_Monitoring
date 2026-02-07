// backend-ts/src/alert/alert.controller.ts
import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { AlertService, AlertConfigDto } from './alert.service';
import { AlertConfig } from './alert-config.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('alert')
@UseGuards(JwtAuthGuard)
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Get('config')
  getConfig(): Promise<AlertConfig> {
    return this.alertService.getConfig();
  }

  @Put('config')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateConfig(@Body() dto: AlertConfigDto): Promise<AlertConfig> {
    return this.alertService.updateConfig(dto);
  }

  @Post('test')
  @UseGuards(RolesGuard)
  @Roles('admin')
  testTelegram(): Promise<{ success: boolean; message: string }> {
    return this.alertService.testTelegram();
  }
}
