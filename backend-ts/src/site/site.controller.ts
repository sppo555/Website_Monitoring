// backend-ts/src/site/site.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { SiteService, SiteDto } from './site.service';
import { Site } from './site.entity';

@Controller('sites')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() siteDto: SiteDto): Promise<Site> {
    // 驗證 URL 格式等應在 DTO 類中實作
    if (!siteDto.url) {
        throw new BadRequestException('URL is required');
    }
    return this.siteService.create(siteDto);
  }

  @Get()
  findAll(): Promise<Site[]> {
    return this.siteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Site> {
    return this.siteService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() siteDto: SiteDto): Promise<Site> {
    return this.siteService.update(id, siteDto);
  }

  @Put(':id/status/:status')
  updateStatus(
    @Param('id') id: string,
    @Param('status') status: 'active' | 'paused',
  ): Promise<Site> {
    // 這裡調用 service 內的邏輯，service 已經包含驗證
    return this.siteService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.siteService.remove(id);
  }
}