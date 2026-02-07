// backend-ts/src/auth/auth.controller.ts
import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService, CreateUserDto, UpdateUserDto } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard, Roles } from './roles.guard';
import { AuditService } from '../audit/audit.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { username: string; password: string }) {
    const result = await this.authService.login(body.username, body.password);
    await this.auditService.log(result.user.id, result.user.username, 'login');
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: any) {
    return req.user;
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req: any, @Body() body: { oldPassword: string; newPassword: string }) {
    await this.authService.changePassword(req.user.id, body.oldPassword, body.newPassword);
    await this.auditService.log(req.user.id, req.user.username, 'change_password');
    return { message: '密碼修改成功' };
  }

  // === 以下端點僅 admin 可存取 ===

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.authService.findAllUsers();
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Request() req: any, @Body() dto: CreateUserDto) {
    const result = await this.authService.createUser(dto);
    await this.auditService.log(req.user.id, req.user.username, 'create_user', dto.username);
    return result;
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateUser(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    const result = await this.authService.updateUser(id, dto);
    await this.auditService.log(req.user.id, req.user.username, 'update_user', result.username, dto.password ? '含密碼修改' : undefined);
    return result;
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Request() req: any, @Param('id') id: string) {
    await this.authService.deleteUser(id);
    await this.auditService.log(req.user.id, req.user.username, 'delete_user', id);
  }
}
