// backend-ts/src/auth/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type UserRole = 'admin' | 'allread' | 'onlyedit' | 'onlyread';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column()
  passwordHash!: string;

  @Column({ default: 'onlyread' })
  role!: UserRole;

  // 指定可存取的群組 ID 陣列（onlyedit / onlyread 角色使用）
  @Column('text', { array: true, default: '{}' })
  assignedGroupIds!: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
