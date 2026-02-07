// backend-ts/src/retention/retention.controller.ts
import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { RetentionService, RetentionConfigDto } from './retention.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { AuditService } from '../audit/audit.service';

@Controller('retention')
@UseGuards(JwtAuthGuard)
export class RetentionController {
  constructor(
    private readonly retentionService: RetentionService,
    private readonly auditService: AuditService,
  ) {}

  @Get('config')
  getConfig() {
    return this.retentionService.getConfig();
  }

  @Put('config')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateConfig(@Request() req: any, @Body() dto: RetentionConfigDto) {
    const result = await this.retentionService.updateConfig(dto);
    await this.auditService.log(req.user.id, req.user.username, 'update_retention_config', undefined, JSON.stringify(dto));
    return result;
  }
}
