// backend-ts/src/site/site.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Group } from '../group/group.entity';

@Entity('sites')
export class Site {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  domain!: string;

  @Column({ default: true })
  checkHttp!: boolean;

  @Column({ default: true })
  checkHttps!: boolean;

  @Column({ default: true })
  checkTls!: boolean;

  @Column({ default: true })
  checkWhois!: boolean;

  // HTTP/HTTPS 檢查間隔（秒），最低 60
  @Column({ default: 300 })
  httpCheckIntervalSeconds!: number;

  // TLS 證書檢查間隔（天），最低 1
  @Column({ default: 1 })
  tlsCheckIntervalDays!: number;

  // WHOIS 域名檢查間隔（天），最低 1
  @Column({ default: 1 })
  domainCheckIntervalDays!: number;

  // 連續失敗幾次後發送告警
  @Column({ default: 3 })
  failureThreshold!: number;

  // 目前連續失敗次數（由系統更新）
  @Column({ default: 0 })
  consecutiveFailures!: number;

  // 最後一次 HTTP/HTTPS 檢查時間
  @Column({ type: 'timestamptz', nullable: true })
  lastHttpCheck!: Date | null;

  // 最後一次 TLS 檢查時間
  @Column({ type: 'timestamptz', nullable: true })
  lastTlsCheck!: Date | null;

  // 最後一次 WHOIS 檢查時間
  @Column({ type: 'timestamptz', nullable: true })
  lastWhoisCheck!: Date | null;

  @Column({ default: 'active' })
  status!: 'active' | 'paused';

  @ManyToMany(() => Group, group => group.sites, { cascade: true })
  @JoinTable({ name: 'site_groups' })
  groups!: Group[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
