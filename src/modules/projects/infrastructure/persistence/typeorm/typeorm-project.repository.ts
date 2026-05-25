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

  async findById(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<Project | null> {
    const ormEntity = await this.findOneById(projectId.toString(), {
      organizationId,
    });

    return ormEntity ? ProjectMapper.toDomain(ormEntity) : null;
  }
}
