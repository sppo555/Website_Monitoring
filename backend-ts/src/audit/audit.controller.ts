// backend-ts/src/audit/audit.controller.ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAll() {
    return this.auditService.findAll();
  }

  @Get('me')
  findMine(@Request() req: any) {
    return this.auditService.findByUser(req.user.id);
  }
}
