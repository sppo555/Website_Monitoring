// backend-ts/src/group/group.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, HttpCode, HttpStatus, BadRequestException, UseGuards } from '@nestjs/common';
import { GroupService, GroupDto } from './group.service';
import { Group } from './group.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: GroupDto): Promise<Group> {
    if (!dto.name) {
      throw new BadRequestException('Group name is required');
    }
    return this.groupService.create(dto);
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
  update(@Param('id') id: string, @Body() dto: GroupDto): Promise<Group> {
    return this.groupService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.groupService.remove(id);
  }
}
