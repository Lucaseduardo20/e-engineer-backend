import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type {
  Deliverable as DeliverableContract,
  Paginated,
} from '../../../../shared/contracts/dashboard.contracts';
import { TypeOrmTenantScopedRepository } from '../../../../shared/infrastructure/persistence/typeorm/typeorm-tenant-scoped.repository';
import { ProjectOrmEntity } from '../../../projects/infrastructure/persistence/typeorm/project.orm-entity';
import { Deliverable } from '../../domain/entities/deliverable';
import {
  type DeliverableRepository as DeliverableRepositoryPort,
  type ListDeliverablesParams,
} from '../../domain/repositories/deliverable.repository';
import { DeliverableMapper } from '../mappers/deliverable.mapper';
import { DeliverableOrmEntity } from '../persistence/typeorm/deliverable.orm-entity';

@Injectable()
export class TypeOrmDeliverableRepository
  extends TypeOrmTenantScopedRepository<DeliverableOrmEntity>
  implements DeliverableRepositoryPort
{
  constructor(
    @InjectRepository(DeliverableOrmEntity)
    repository: Repository<DeliverableOrmEntity>,
    @InjectRepository(ProjectOrmEntity)
    private readonly projects: Repository<ProjectOrmEntity>,
  ) {
    super(repository);
  }

  async save(deliverable: Deliverable): Promise<void> {
    await this.saveOrm(DeliverableMapper.toOrm(deliverable));
  }

  async list(
    organizationId: OrganizationId,
    params: ListDeliverablesParams,
  ): Promise<Paginated<DeliverableContract>> {
    const query = this.repository
      .createQueryBuilder('deliverable')
      .where('deliverable.organizationId = :organizationId', {
        organizationId: organizationId.toString(),
      })
      .orderBy('deliverable.dueDate', 'ASC', 'NULLS LAST')
      .addOrderBy('deliverable.name', 'ASC')
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize);

    if (params.projectId) {
      query.andWhere('deliverable.projectId = :projectId', {
        projectId: params.projectId.toString(),
      });
    }

    if (params.status) {
      query.andWhere('deliverable.status = :status', {
        status: params.status,
      });
    }

    const [items, total] = await query.getManyAndCount();

    return {
      items: items.map((item) => DeliverableMapper.ormToResponse(item)),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  async getById(
    deliverableId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<DeliverableContract | null> {
    const deliverable = await this.repository.findOne({
      where: {
        id: deliverableId.toString(),
        organizationId: organizationId.toString(),
      },
    });

    return deliverable ? DeliverableMapper.ormToResponse(deliverable) : null;
  }

  async findById(
    deliverableId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<Deliverable | null> {
    const ormEntity = await this.findOneById(deliverableId.toString(), {
      organizationId,
    });

    return ormEntity ? DeliverableMapper.toDomain(ormEntity) : null;
  }

  projectExists(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<boolean> {
    return this.projects.exists({
      where: {
        id: projectId.toString(),
        organizationId: organizationId.toString(),
      },
    });
  }
}
