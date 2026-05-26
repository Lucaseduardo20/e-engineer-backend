import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import type {
  Paginated,
  Project,
} from '../../../../shared/contracts/dashboard.contracts';
import {
  mapProjectStatus,
  progressFromStatus,
} from '../../../../shared/presentation/status-mappers';
import { ProjectOrmEntity } from '../../../projects/infrastructure/persistence/typeorm/project.orm-entity';

@Injectable()
export class KnowledgeBaseQueryService {
  constructor(
    @InjectRepository(ProjectOrmEntity)
    private readonly projects: Repository<ProjectOrmEntity>,
  ) {}

  async search(input: {
    organizationId: string;
    q?: string;
    page: number;
    pageSize: number;
  }): Promise<Paginated<Project>> {
    const [items, total] = await this.projects.findAndCount({
      where: {
        organizationId: input.organizationId,
        ...(input.q ? { name: ILike(`%${input.q}%`) } : {}),
      },
      order: { updatedAt: 'DESC' },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    });

    return {
      items: items.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.client ?? undefined,
        status: mapProjectStatus(project.status),
        organizationId: project.organizationId,
        progress: progressFromStatus(project.status),
        metrics: {
          references: project.tags.length,
        },
      })),
      total,
      page: input.page,
      pageSize: input.pageSize,
    };
  }
}
