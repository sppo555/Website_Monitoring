// backend-ts/src/site/site.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './site.entity';

// DTO for Site creation/update
export interface SiteDto {
  url: string;
  checkIntervalSeconds?: number;
  checkTls?: boolean;
  checkWhois?: boolean;
}

@Injectable()
export class SiteService {
  constructor(
    @InjectRepository(Site)
    private sitesRepository: Repository<Site>,
  ) {}

  /**
   * 建立新的監控網站
   * @param siteDto 網站資訊
   */
  async create(siteDto: SiteDto): Promise<Site> {
    const newSite = this.sitesRepository.create(siteDto);
    return this.sitesRepository.save(newSite);
  }

  /**
   * 取得所有監控中的網站
   */
  findAll(): Promise<Site[]> {
    return this.sitesRepository.find();
  }

  /**
   * 根據 ID 取得網站
   * @param id 網站 UUID
   */
  async findOne(id: string): Promise<Site> {
    const site = await this.sitesRepository.findOne({ where: { id } });
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }
    return site;
  }

  /**
   * 更新網站配置
   * @param id 網站 UUID
   * @param siteDto 更新資訊
   */
  async update(id: string, siteDto: SiteDto): Promise<Site> {
    await this.sitesRepository.update(id, siteDto);
    return this.findOne(id);
  }

  /**
   * 暫停或啟動監控
   * @param id 網站 UUID
   * @param status 'active' 或 'paused'
   */
  async updateStatus(id: string, status: 'active' | 'paused'): Promise<Site> {
    if (status !== 'active' && status !== 'paused') {
        throw new BadRequestException('Status must be active or paused'); 
    }
    await this.sitesRepository.update(id, { status });
    return this.findOne(id);
  }

  /**
   * 刪除網站
   * @param id 網站 UUID
   */
  async remove(id: string): Promise<void> {
    const result = await this.sitesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }
  }
}