import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type {
  Deliverable as DeliverableContract,
  Paginated,
} from '../../../../shared/contracts/dashboard.contracts';
import { TypeOrmTenantScopedRepository } from '../../../../shared/infrastructure/persistence/typeorm/typeorm-tenant-scoped.repository';
import { ProjectOrmEntity } from '../../../projects/infrastructure/persistence/typeorm/project.orm-entity';
import { DeliverableBaseRelationOrmEntity } from '../../../projects/infrastructure/persistence/typeorm/deliverable-base-relation.orm-entity';
import { DeliverableRemovalRequestOrmEntity } from '../persistence/typeorm/deliverable-removal-request.orm-entity';
import { TechnicalTagOrmEntity } from '../../../technical-taxonomy/infrastructure/persistence/typeorm/technical-tag.orm-entity';
import { Deliverable } from '../../domain/entities/deliverable';
import {
  type DeliverableRepository as DeliverableRepositoryPort,
  type ListDeliverablesParams,
} from '../../domain/repositories/deliverable.repository';
import { DeliverableMapper } from '../mappers/deliverable.mapper';
import { DeliverableTagOrmEntity } from '../persistence/typeorm/deliverable-tag.orm-entity';
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
    @InjectRepository(DeliverableTagOrmEntity)
    private readonly deliverableTags: Repository<DeliverableTagOrmEntity>,
    @InjectRepository(TechnicalTagOrmEntity)
    private readonly technicalTags: Repository<TechnicalTagOrmEntity>,
    @InjectRepository(DeliverableBaseRelationOrmEntity)
    private readonly deliverableBaseRelations: Repository<DeliverableBaseRelationOrmEntity>,
    @InjectRepository(DeliverableRemovalRequestOrmEntity)
    private readonly deliverableRemovalRequests: Repository<DeliverableRemovalRequestOrmEntity>,
  ) {
    super(repository);
  }

  async save(deliverable: Deliverable): Promise<void> {
    await this.saveOrm(DeliverableMapper.toOrm(deliverable));
  }

  async syncTags(params: {
    deliverableId: UniqueEntityId;
    organizationId: OrganizationId;
    tagIds: string[];
    actorId: string;
  }): Promise<void> {
    await this.deliverableTags.delete({
      deliverableId: params.deliverableId.toString(),
      organizationId: params.organizationId.toString(),
    });

    const unique = [...new Set(params.tagIds)];
    if (!unique.length) return;

    await this.deliverableTags.save(
      unique.map((tagId) => ({
        id: randomUUID(),
        organizationId: params.organizationId.toString(),
        deliverableId: params.deliverableId.toString(),
        tagId,
        createdBy: params.actorId,
      })),
    );
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
    const tagsByDeliverable = await this.findTagsByDeliverableIds(
      organizationId,
      items.map((item) => item.id),
    );
    const inheritanceByDeliverable = await this.findInheritanceByDeliverableIds(
      organizationId,
      items.map((item) => item.id),
    );
    const removalRequestByDeliverable = await this.findPendingRemovalRequestsByDeliverableIds(
      organizationId,
      items.map((item) => item.id),
    );

    return {
      items: items.map((item) =>
        this.withInheritanceReview(
          DeliverableMapper.ormToResponse(
            item,
            tagsByDeliverable.get(item.id) ?? [],
          ),
          inheritanceByDeliverable.get(item.id) ?? null,
          removalRequestByDeliverable.get(item.id) ?? null,
        ),
      ),
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

    if (!deliverable) return null;

    const tagsByDeliverable = await this.findTagsByDeliverableIds(organizationId, [
      deliverable.id,
    ]);
    const inheritanceByDeliverable = await this.findInheritanceByDeliverableIds(
      organizationId,
      [deliverable.id],
    );
    const removalRequestByDeliverable =
      await this.findPendingRemovalRequestsByDeliverableIds(organizationId, [
        deliverable.id,
      ]);

    return this.withInheritanceReview(
      DeliverableMapper.ormToResponse(
        deliverable,
        tagsByDeliverable.get(deliverable.id) ?? [],
      ),
      inheritanceByDeliverable.get(deliverable.id) ?? null,
      removalRequestByDeliverable.get(deliverable.id) ?? null,
    );
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

  async markInheritanceReviewed(params: {
    deliverableId: UniqueEntityId;
    organizationId: OrganizationId;
    reviewedBy: string;
  }): Promise<DeliverableContract | null> {
    const organizationId = params.organizationId.toString();
    const deliverableId = params.deliverableId.toString();
    const relation = await this.deliverableBaseRelations.findOne({
      where: {
        organizationId,
        targetDeliverableId: deliverableId,
      },
    });

    if (!relation) {
      return null;
    }

    await this.deliverableBaseRelations.update(
      {
        id: relation.id,
        organizationId,
      },
      {
        needsReviewAfterInheritance: false,
        reviewedBy: params.reviewedBy,
        reviewedAt: new Date(),
      },
    );

    return this.getById(params.deliverableId, params.organizationId);
  }

  async delete(params: {
    deliverableId: UniqueEntityId;
    organizationId: OrganizationId;
  }): Promise<boolean> {
    const result = await this.repository.delete({
      id: params.deliverableId.toString(),
      organizationId: params.organizationId.toString(),
    });

    return (result.affected ?? 0) > 0;
  }

  private async findTagsByDeliverableIds(
    organizationId: OrganizationId,
    deliverableIds: string[],
  ): Promise<
    Map<
      string,
      Array<{
        id: string;
        name: string;
        slug: string;
        category: string;
        status: string;
      }>
    >
  > {
    if (!deliverableIds.length) return new Map();

    const rows = await this.deliverableTags
      .createQueryBuilder('dt')
      .innerJoin('technical_tags', 'tag', 'tag.id = dt.tag_id AND tag.organization_id = dt.organization_id')
      .where('dt.organization_id = :organizationId', {
        organizationId: organizationId.toString(),
      })
      .andWhere('dt.deliverable_id IN (:...deliverableIds)', { deliverableIds })
      .select([
        'dt.deliverable_id AS "deliverableId"',
        'tag.id AS "id"',
        'tag.name AS "name"',
        'tag.slug AS "slug"',
        'tag.category AS "category"',
        'tag.status AS "status"',
      ])
      .getRawMany<{
        deliverableId: string;
        id: string;
        name: string;
        slug: string;
        category: string;
        status: string;
      }>();

    return rows.reduce((map, row) => {
      const current = map.get(row.deliverableId) ?? [];
      current.push({
        id: row.id,
        name: row.name,
        slug: row.slug,
        category: row.category,
        status: row.status,
      });
      map.set(row.deliverableId, current);
      return map;
    }, new Map<string, Array<{ id: string; name: string; slug: string; category: string; status: string }>>());
  }

  private async findInheritanceByDeliverableIds(
    organizationId: OrganizationId,
    deliverableIds: string[],
  ): Promise<Map<string, DeliverableBaseRelationOrmEntity>> {
    if (!deliverableIds.length) return new Map();

    const relations = await this.deliverableBaseRelations.find({
      where: {
        organizationId: organizationId.toString(),
        targetDeliverableId: In(deliverableIds),
      },
    });

    return new Map(
      relations.map((relation) => [relation.targetDeliverableId, relation]),
    );
  }

  private withInheritanceReview(
    deliverable: DeliverableContract,
    relation: DeliverableBaseRelationOrmEntity | null,
    removalRequest: DeliverableRemovalRequestOrmEntity | null = null,
  ): DeliverableContract {
    return {
      ...deliverable,
      inheritanceReview: relation
        ? {
            relationId: relation.id,
            baseProjectId: relation.baseProjectId,
            baseDeliverableId: relation.baseDeliverableId,
            needsReviewAfterInheritance: relation.needsReviewAfterInheritance,
            reviewedBy: relation.reviewedBy,
            reviewedAt: relation.reviewedAt?.toISOString() ?? null,
          }
        : null,
      removalRequest: removalRequest
        ? {
            id: removalRequest.id,
            status: removalRequest.status,
            reason: removalRequest.reason,
            requestedBy: removalRequest.requestedBy,
            reviewedBy: removalRequest.reviewedBy,
            reviewedAt: removalRequest.reviewedAt?.toISOString() ?? null,
            reviewComment: removalRequest.reviewComment,
          }
        : null,
    };
  }

  private async findPendingRemovalRequestsByDeliverableIds(
    organizationId: OrganizationId,
    deliverableIds: string[],
  ): Promise<Map<string, DeliverableRemovalRequestOrmEntity>> {
    if (!deliverableIds.length) return new Map();

    const requests = await this.deliverableRemovalRequests.find({
      where: {
        organizationId: organizationId.toString(),
        deliverableId: In(deliverableIds),
        status: 'requested',
      },
    });

    return new Map(requests.map((request) => [request.deliverableId, request]));
  }
}
