// backend-ts/src/retention/retention.controller.ts
import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { RetentionService, RetentionConfigDto } from './retention.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('retention')
@UseGuards(JwtAuthGuard)
export class RetentionController {
  constructor(private readonly retentionService: RetentionService) {}

  @Get('config')
  getConfig() {
    return this.retentionService.getConfig();
  }

  @Put('config')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateConfig(@Body() dto: RetentionConfigDto) {
    return this.retentionService.updateConfig(dto);
  }
}
