// backend-ts/src/group/group.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './group.entity';

export interface GroupDto {
  name: string;
  description?: string;
}

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
  ) {}

  async create(dto: GroupDto): Promise<Group> {
    const group = this.groupRepository.create(dto);
    return this.groupRepository.save(group);
  }

  findAll(): Promise<Group[]> {
    return this.groupRepository.find({ relations: ['sites'] });
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupRepository.findOne({ where: { id }, relations: ['sites'] });
    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }
    return group;
  }

  async update(id: string, dto: GroupDto): Promise<Group> {
    await this.groupRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.groupRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }
  }
}
