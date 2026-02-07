// backend-ts/src/site/site-check-result.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Site } from './site.entity';

@Entity('site_check_results')
export class SiteCheckResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string; // 使用 ! 告訴 TypeScript 已經被 TypeORM 處理

  @Column()
  @Index() // 建立索引以加快查詢速度
  siteId!: string;

  @ManyToOne(() => Site)
  @JoinColumn({ name: 'siteId' })
  site!: Site;

  @Column()
  isHealthy!: boolean; // 總體健康狀態 (true/false)

  @Column({ type: 'int', nullable: true })
  httpStatus: number | null = null; // HTTP 狀態碼

  @Column({ type: 'int', nullable: true })
  tlsDaysLeft: number | null = null; // 證書剩餘天數

  @Column({ type: 'int', nullable: true })
  domainDaysLeft: number | null = null; // 域名剩餘天數

  @Column({ type: 'text', nullable: true })
  errorDetails: string | null = null; // 錯誤詳情

  @CreateDateColumn()
  checkedAt!: Date; // 檢查時間
}