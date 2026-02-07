// backend-ts/src/audit/audit.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditLog');

  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async log(userId: string, username: string, action: string, target?: string, details?: string): Promise<void> {
    const entry = { userId, username, action, target: target || null, details: details || null };
    await this.auditRepo.save(this.auditRepo.create(entry));
    this.logger.log(JSON.stringify({ user: username, action, target: entry.target, details: entry.details }));
  }

  async findAll(limit: number = 200): Promise<AuditLog[]> {
    return this.auditRepo.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  async findByUser(userId: string, limit: number = 200): Promise<AuditLog[]> {
    return this.auditRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: limit });
  }
}
