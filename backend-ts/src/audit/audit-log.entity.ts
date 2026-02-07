// backend-ts/src/audit/audit-log.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  username!: string;

  @Column()
  action!: string;

  @Column({ type: 'varchar', nullable: true })
  target!: string | null;

  @Column({ type: 'text', nullable: true })
  details!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
