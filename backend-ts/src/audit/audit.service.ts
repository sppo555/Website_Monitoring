// backend-ts/src/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async log(userId: string, username: string, action: string, target?: string, details?: string): Promise<void> {
    await this.auditRepo.save(
      this.auditRepo.create({ userId, username, action, target: target || null, details: details || null }),
    );
  }

  async findAll(limit: number = 200): Promise<AuditLog[]> {
    return this.auditRepo.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  async findByUser(userId: string, limit: number = 200): Promise<AuditLog[]> {
    return this.auditRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: limit });
  }
}
