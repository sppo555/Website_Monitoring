// backend-ts/src/auth/auth.service.ts
import { Injectable, BadRequestException, UnauthorizedException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './user.entity';

export interface CreateUserDto {
  username: string;
  password: string;
  role: UserRole;
  assignedGroupIds?: string[];
}

export interface UpdateUserDto {
  password?: string;
  role?: UserRole;
  assignedGroupIds?: string[];
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  // 啟動時自動建立預設 admin 帳號
  async onModuleInit() {
    const adminExists = await this.userRepo.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      const hash = await bcrypt.hash('admin', 10);
      await this.userRepo.save(
        this.userRepo.create({
          username: 'admin',
          passwordHash: hash,
          role: 'admin',
          assignedGroupIds: [],
        }),
      );
      this.logger.log('預設 admin 帳號已建立（密碼: admin）');
    }
  }

  async login(username: string, password: string): Promise<{ access_token: string; user: any }> {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('帳號或密碼錯誤');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('帳號或密碼錯誤');
    }
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        assignedGroupIds: user.assignedGroupIds,
      },
    };
  }

  async createUser(dto: CreateUserDto): Promise<any> {
    const existing = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existing) {
      throw new BadRequestException(`使用者 ${dto.username} 已存在`);
    }
    const hash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      username: dto.username,
      passwordHash: hash,
      role: dto.role,
      assignedGroupIds: dto.assignedGroupIds || [],
    });
    const saved = await this.userRepo.save(user);
    return { id: saved.id, username: saved.username, role: saved.role, assignedGroupIds: saved.assignedGroupIds };
  }

  async findAllUsers(): Promise<any[]> {
    const users = await this.userRepo.find({ order: { createdAt: 'ASC' } });
    return users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      assignedGroupIds: u.assignedGroupIds,
      createdAt: u.createdAt,
    }));
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new BadRequestException('使用者不存在');

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    if (dto.role) user.role = dto.role;
    if (dto.assignedGroupIds !== undefined) user.assignedGroupIds = dto.assignedGroupIds;

    const saved = await this.userRepo.save(user);
    return { id: saved.id, username: saved.username, role: saved.role, assignedGroupIds: saved.assignedGroupIds };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('使用者不存在');
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('舊密碼不正確');
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new BadRequestException('使用者不存在');
    if (user.username === 'admin') throw new BadRequestException('無法刪除預設 admin 帳號');
    await this.userRepo.delete(id);
  }
}
