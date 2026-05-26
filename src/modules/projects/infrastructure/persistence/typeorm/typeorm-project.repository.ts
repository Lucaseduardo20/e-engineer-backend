import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmTenantScopedRepository } from '../../../../../shared/infrastructure/persistence/typeorm/typeorm-tenant-scoped.repository';
import { OrganizationId } from '../../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../../shared/domain/value-objects/unique-entity-id';
import { Project } from '../../../domain/entities/project';
import { ProjectRepository } from '../../../domain/repositories/project.repository';
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
    params: { page: number; pageSize: number },
  ): Promise<Paginated<ProjectContract>> {
    const [items, total] = await this.repository.findAndCount({
      where: { organizationId: organizationId.toString() },
      order: { updatedAt: 'DESC', name: 'ASC' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    });

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
      status: mapProjectStatus(project.status),
      organizationId: project.organizationId,
      progress: progressFromStatus(project.status),
      metrics: {
        tags: project.tags.length,
      },
    };
  }
}
