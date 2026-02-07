// backend-ts/src/alert/alert-config.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('alert_config')
export class AlertConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: '' })
  telegramBotToken!: string;

  @Column({ default: '' })
  telegramChatId!: string;

  @Column({ default: 14 })
  tlsAlertDays!: number;

  @Column({ default: 30 })
  domainAlertDays!: number;

  @Column({ default: false })
  enabled!: boolean;

  @UpdateDateColumn()
  updatedAt!: Date;
}
