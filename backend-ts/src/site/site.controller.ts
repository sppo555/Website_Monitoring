// backend-ts/src/site/site.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, HttpCode, HttpStatus, BadRequestException, UseGuards, Request, Query } from '@nestjs/common';
import { SiteService, SiteDto, BatchImportDto, BulkUpdateDto } from './site.service';
import { Site } from './site.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { AuditService } from '../audit/audit.service';

@Controller('sites')
@UseGuards(JwtAuthGuard)
export class SiteController {
  constructor(
    private readonly siteService: SiteService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'onlyedit')
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req: any, @Body() siteDto: SiteDto) {
    if (!siteDto.domain) {
        throw new BadRequestException('domain is required');
    }
    const result = await this.siteService.create(siteDto);
    await this.auditService.log(req.user.id, req.user.username, 'create_site', siteDto.domain);
    return result;
  }

  @Post('batch')
  @UseGuards(RolesGuard)
  @Roles('admin', 'onlyedit')
  @HttpCode(HttpStatus.CREATED)
  async batchCreate(@Request() req: any, @Body() dto: BatchImportDto) {
    if (!dto.sites || !Array.isArray(dto.sites) || dto.sites.length === 0) {
      throw new BadRequestException('sites array is required and must not be empty');
    }
    for (const s of dto.sites) {
      if (!s.domain) {
        throw new BadRequestException('Each site must have a domain');
      }
    }
    const result = await this.siteService.batchCreate(dto);
    await this.auditService.log(req.user.id, req.user.username, 'batch_create_sites', `${dto.sites.length} sites`);
    return result;
  }

  @Get()
  findAll(): Promise<Site[]> {
    return this.siteService.findAll();
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string, @Query('range') range?: string) {
    const hours = this.parseRange(range || '24h');
    return this.siteService.getHistory(id, hours);
  }

  private parseRange(range: string): number {
    const match = range.match(/^(\d+)(h|d)$/);
    if (!match) return 24;
    const val = parseInt(match[1], 10);
    const unit = match[2];
    const hours = unit === 'd' ? val * 24 : val;
    return Math.min(hours, 14 * 24); // max 14 days
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Site> {
    return this.siteService.findOne(id);
  }

  @Put('bulk')
  @UseGuards(RolesGuard)
  @Roles('admin', 'onlyedit')
  async bulkUpdate(@Request() req: any, @Body() dto: BulkUpdateDto) {
    const result = await this.siteService.bulkUpdate(dto);
    await this.auditService.log(req.user.id, req.user.username, 'bulk_update_sites', `${dto.siteIds.length} sites`);
    return result;
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'onlyedit')
  async update(@Request() req: any, @Param('id') id: string, @Body() siteDto: SiteDto) {
    const result = await this.siteService.update(id, siteDto);
    await this.auditService.log(req.user.id, req.user.username, 'update_site', result.domain);
    return result;
  }

  @Put(':id/status/:status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'onlyedit')
  async updateStatus(@Request() req: any, @Param('id') id: string, @Param('status') status: 'active' | 'paused') {
    const result = await this.siteService.updateStatus(id, status);
    await this.auditService.log(req.user.id, req.user.username, 'update_status', `${result.domain} → ${status}`);
    return result;
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req: any, @Param('id') id: string) {
    const site = await this.siteService.findOne(id);
    await this.siteService.remove(id);
    await this.auditService.log(req.user.id, req.user.username, 'delete_site', site.domain);
  }
}