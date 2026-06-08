import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmTenantScopedRepository } from '../../../../../shared/infrastructure/persistence/typeorm/typeorm-tenant-scoped.repository';
import { OrganizationId } from '../../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../../shared/domain/value-objects/unique-entity-id';
import { Project } from '../../../domain/entities/project';
import {
  type ListProjectsParams,
  ProjectRepository,
} from '../../../domain/repositories/project.repository';
import { ProjectMapper } from '../../mappers/project.mapper';
import { ProjectOrmEntity } from './project.orm-entity';
import type {
  Paginated,
  Project as ProjectContract,
} from '../../../../../shared/contracts/dashboard.contracts';
import {
  mapProjectStatus,
  progressFromStatus,
} from '../../../../../shared/presentation/status-mappers';

const projectStatusFilters: Record<ProjectContract['status'], string[]> = {
  draft: ['draft', 'planning'],
  active: ['active', 'in_progress', 'in_review', 'overdue'],
  paused: ['on_hold', 'waiting_approval'],
  completed: ['completed'],
  archived: ['cancelled'],
};

@Injectable()
export class TypeOrmProjectRepository
  extends TypeOrmTenantScopedRepository<ProjectOrmEntity>
  implements ProjectRepository
{
  constructor(
    @InjectRepository(ProjectOrmEntity)
    repository: Repository<ProjectOrmEntity>,
  ) {
    super(repository);
  }

  async save(project: Project): Promise<void> {
    await this.saveOrm(ProjectMapper.toOrm(project));
  }

  async list(
    organizationId: OrganizationId,
    params: ListProjectsParams,
  ): Promise<Paginated<ProjectContract>> {
    const query = this.repository
      .createQueryBuilder('project')
      .where('project.organizationId = :organizationId', {
        organizationId: organizationId.toString(),
      })
      .orderBy('project.updatedAt', 'DESC')
      .addOrderBy('project.name', 'ASC')
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize);

    if (params.name) {
      query.andWhere('project.name ILIKE :name', {
        name: `%${params.name}%`,
      });
    }

    if (params.status) {
      query.andWhere('project.status IN (:...statuses)', {
        statuses: projectStatusFilters[params.status],
      });
    }

    const [items, total] = await query.getManyAndCount();

    return {
      items: items.map((item) => this.toContract(item)),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  async getById(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<ProjectContract | null> {
    const project = await this.repository.findOne({
      where: {
        id: projectId.toString(),
        organizationId: organizationId.toString(),
      },
    });

    return project ? this.toContract(project) : null;
  }

  async findById(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<Project | null> {
    const ormEntity = await this.findOneById(projectId.toString(), {
      organizationId,
    });

    return ormEntity ? ProjectMapper.toDomain(ormEntity) : null;
  }

  private toContract(project: ProjectOrmEntity): ProjectContract {
    return {
      id: project.id,
      name: project.name,
      description: project.client ?? undefined,
      client: project.client,
      projectType: project.projectType,
      responsibleName: project.responsibleName,
      status: mapProjectStatus(project.status),
      organizationId: project.organizationId,
      progress: progressFromStatus(project.status),
      tags: project.tags,
      metrics: {
        tags: project.tags.length,
      },
    };
  }
}
