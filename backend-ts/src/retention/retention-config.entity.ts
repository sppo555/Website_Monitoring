// backend-ts/src/retention/retention-config.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('retention_config')
export class RetentionConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: false })
  auditLogEnabled!: boolean;

  @Column({ default: 30 })
  auditLogRetentionDays!: number;

  @Column({ default: false })
  checkResultEnabled!: boolean;

  @Column({ default: 14 })
  checkResultRetentionDays!: number;
}
