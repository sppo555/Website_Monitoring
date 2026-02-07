// backend-ts/src/group/group.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, HttpCode, HttpStatus, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { GroupService, GroupDto } from './group.service';
import { Group } from './group.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { AuditService } from '../audit/audit.service';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req: any, @Body() dto: GroupDto): Promise<Group> {
    if (!dto.name) {
      throw new BadRequestException('Group name is required');
    }
    const result = await this.groupService.create(dto);
    await this.auditService.log(req.user.id, req.user.username, 'create_group', dto.name);
    return result;
  }

  @Get()
  findAll(): Promise<Group[]> {
    return this.groupService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Group> {
    return this.groupService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: GroupDto): Promise<Group> {
    const result = await this.groupService.update(id, dto);
    await this.auditService.log(req.user.id, req.user.username, 'update_group', result.name);
    return result;
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req: any, @Param('id') id: string): Promise<void> {
    const group = await this.groupService.findOne(id);
    await this.groupService.remove(id);
    await this.auditService.log(req.user.id, req.user.username, 'delete_group', group.name);
  }
}
