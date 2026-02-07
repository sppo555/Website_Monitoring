// backend-ts/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SiteModule } from './site/site.module';
import { GroupModule } from './group/group.module';
import { AlertModule } from './alert/alert.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { AuditLog } from './audit/audit-log.entity';
import { RetentionModule } from './retention/retention.module';
import { RetentionConfig } from './retention/retention-config.entity';
import { Site } from './site/site.entity';
import { SiteCheckResult } from './site/site-check-result.entity';
import { Group } from './group/group.entity';
import { AlertConfig } from './alert/alert-config.entity';
import { User } from './auth/user.entity';
import { MonitoringScheduler } from './scheduler/schedule.service';
import { CheckerModule } from './checker/checker.module';
import { RedisModule } from '@nestjs-modules/ioredis'; 


@Module({
  imports: [
    // 1. 資料庫連線配置
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: 5432,
      username: process.env.POSTGRES_USER || 'user', 
      password: process.env.POSTGRES_PASSWORD || 'password', 
      database: process.env.POSTGRES_DB || 'monitoring_db',
      entities: [Site, SiteCheckResult, Group, AlertConfig, User, AuditLog, RetentionConfig],
      synchronize: true, // 開發環境使用
    }),
    
    // 2. 排程模組
    ScheduleModule.forRoot(),

    // 3. Redis 配置 (使用環境變數或預設值)
    RedisModule.forRoot({
      config: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    
    SiteModule,
    GroupModule,
    AlertModule,
    AuthModule,
    AuditModule,
    RetentionModule,
    CheckerModule,
  ],
  controllers: [],
  providers: [MonitoringScheduler], 
})
export class AppModule {}