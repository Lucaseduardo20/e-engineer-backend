import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import type { Paginated } from '../../../../shared/contracts/dashboard.contracts';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { TypeOrmTenantScopedRepository } from '../../../../shared/infrastructure/persistence/typeorm/typeorm-tenant-scoped.repository';
import { DeliverableOrmEntity } from '../../../deliverables/infrastructure/persistence/typeorm/deliverable.orm-entity';
import { DocumentOrmEntity } from '../../../documents/infrastructure/persistence/typeorm/document.orm-entity';
import { ProjectOrmEntity } from '../../../projects/infrastructure/persistence/typeorm/project.orm-entity';
import { KnowledgeAttachment } from '../../domain/entities/knowledge-attachment';
import { KnowledgeItem } from '../../domain/entities/knowledge-item';
import { KnowledgeRelation } from '../../domain/entities/knowledge-relation';
import {
  type KnowledgeItemDetailResponse,
  type KnowledgeItemRepository as KnowledgeItemRepositoryPort,
  type KnowledgeItemResponse,
  type ListKnowledgeItemsParams,
  type SearchKnowledgeItemsParams,
} from '../../domain/repositories/knowledge-item.repository';
import { KnowledgeItemMapper } from '../mappers/knowledge-item.mapper';
import { KnowledgeAttachmentOrmEntity } from '../persistence/typeorm/knowledge-attachment.orm-entity';
import { KnowledgeItemOrmEntity } from '../persistence/typeorm/knowledge-item.orm-entity';
import { KnowledgeRelationOrmEntity } from '../persistence/typeorm/knowledge-relation.orm-entity';
import { KnowledgeItemTagOrmEntity } from '../persistence/typeorm/knowledge-item-tag.orm-entity';
import { TechnicalTagOrmEntity } from '../../../technical-taxonomy/infrastructure/persistence/typeorm/technical-tag.orm-entity';

@Injectable()
export class TypeOrmKnowledgeItemRepository
  extends TypeOrmTenantScopedRepository<KnowledgeItemOrmEntity>
  implements KnowledgeItemRepositoryPort
{
  constructor(
    @InjectRepository(KnowledgeItemOrmEntity)
    repository: Repository<KnowledgeItemOrmEntity>,
    @InjectRepository(KnowledgeRelationOrmEntity)
    private readonly relations: Repository<KnowledgeRelationOrmEntity>,
    @InjectRepository(KnowledgeAttachmentOrmEntity)
    private readonly attachments: Repository<KnowledgeAttachmentOrmEntity>,
    @InjectRepository(ProjectOrmEntity)
    private readonly projects: Repository<ProjectOrmEntity>,
    @InjectRepository(DeliverableOrmEntity)
    private readonly deliverables: Repository<DeliverableOrmEntity>,
    @InjectRepository(DocumentOrmEntity)
    private readonly documents: Repository<DocumentOrmEntity>,
    @InjectRepository(KnowledgeItemTagOrmEntity)
    private readonly itemTags: Repository<KnowledgeItemTagOrmEntity>,
    @InjectRepository(TechnicalTagOrmEntity)
    private readonly technicalTags: Repository<TechnicalTagOrmEntity>,
  ) {
    super(repository);
  }

  async save(item: KnowledgeItem): Promise<void> {
    await this.saveOrm(KnowledgeItemMapper.toOrm(item));
  }

  async findById(
    itemId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<KnowledgeItem | null> {
    const orm = await this.findOneById(itemId.toString(), { organizationId });
    return orm ? KnowledgeItemMapper.toDomain(orm) : null;
  }

  async findByIdWithRelations(
    itemId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<KnowledgeItemDetailResponse | null> {
    const orm = await this.repository.findOne({
      where: {
        id: itemId.toString(),
        organizationId: organizationId.toString(),
      },
      relations: {
        relations: true,
        attachments: true,
      },
      order: {
        relations: { createdAt: 'DESC' },
        attachments: { createdAt: 'DESC' },
      },
    });

    if (!orm) return null;
    const tags = await this.findTagsByItemIds([orm.id], organizationId.toString());
    return KnowledgeItemMapper.ormToDetail(orm, tags.get(orm.id) ?? []);
  }

  list(
    organizationId: OrganizationId,
    params: ListKnowledgeItemsParams,
  ): Promise<Paginated<KnowledgeItemResponse>> {
    return this.runListQuery(organizationId, params);
  }

  search(
    organizationId: OrganizationId,
    params: SearchKnowledgeItemsParams,
  ): Promise<Paginated<KnowledgeItemResponse>> {
    return this.runListQuery(organizationId, params);
  }

  async saveRelation(relation: KnowledgeRelation): Promise<void> {
    await this.relations.save(KnowledgeItemMapper.relationToOrm(relation));
  }

  async saveAttachment(attachment: KnowledgeAttachment): Promise<void> {
    await this.attachments.save(KnowledgeItemMapper.attachmentToOrm(attachment));
  }
  async syncTags(params: { knowledgeItemId: UniqueEntityId; organizationId: OrganizationId; tagIds: string[]; actorId: string; }): Promise<void> {
    await this.itemTags.delete({ knowledgeItemId: params.knowledgeItemId.toString(), organizationId: params.organizationId.toString() });
    const unique = [...new Set(params.tagIds)];
    if (!unique.length) return;
    await this.itemTags.save(unique.map((tagId) => ({
      id: randomUUID(),
      organizationId: params.organizationId.toString(),
      knowledgeItemId: params.knowledgeItemId.toString(),
      tagId,
      createdBy: params.actorId,
    } as KnowledgeItemTagOrmEntity)));
  }

  async removeRelation(params: {
    relationId: UniqueEntityId;
    knowledgeItemId: UniqueEntityId;
    organizationId: OrganizationId;
  }): Promise<void> {
    await this.relations.delete({
      id: params.relationId.toString(),
      knowledgeItemId: params.knowledgeItemId.toString(),
      organizationId: params.organizationId.toString(),
    });
  }

  async targetExists(params: {
    organizationId: OrganizationId;
    targetType: string;
    targetId: UniqueEntityId;
  }): Promise<boolean> {
    const where = {
      id: params.targetId.toString(),
      organizationId: params.organizationId.toString(),
    };

    if (params.targetType === 'project') {
      return this.projects.exists({ where });
    }

    if (params.targetType === 'deliverable') {
      return this.deliverables.exists({ where });
    }

    if (params.targetType === 'document' || params.targetType === 'document_version') {
      return this.documents.exists({ where });
    }

    if (params.targetType === 'review') {
      return true;
    }

    if (params.targetType === 'template') {
      return true;
    }

    if (params.targetType === 'knowledge_item') {
      return this.repository.exists({ where });
    }

    return false;
  }

  private async runListQuery(
    organizationId: OrganizationId,
    params: SearchKnowledgeItemsParams,
  ): Promise<Paginated<KnowledgeItemResponse>> {
    const query = this.repository
      .createQueryBuilder('item')
      .where('item.organizationId = :organizationId', {
        organizationId: organizationId.toString(),
      })
      .orderBy('item.updatedAt', 'DESC')
      .addOrderBy('item.title', 'ASC')
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize);

    if (params.type) {
      query.andWhere('item.type = :type', { type: params.type });
    }

    if (params.status) {
      query.andWhere('item.status = :status', { status: params.status });
    } else if (!params.includeArchived) {
      query.andWhere('item.status != :archivedStatus', { archivedStatus: 'archived' });
    }

    if (params.tagIds?.length) {
      query.innerJoin('knowledge_item_tags', 'kit', 'kit.knowledge_item_id = item.id AND kit.organization_id = :organizationId', { organizationId: organizationId.toString() })
        .andWhere('kit.tag_id IN (:...tagIds)', { tagIds: params.tagIds });
    }

    if (params.query) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('item.title ILIKE :query', { query: `%${params.query}%` })
            .orWhere('item.description ILIKE :query', {
              query: `%${params.query}%`,
            })
            .orWhere('item.tags::text ILIKE :query', {
              query: `%${params.query}%`,
            })
            .orWhere('item.content::text ILIKE :query', {
              query: `%${params.query}%`,
            });
        }),
      );
    }

    const [items, total] = await query.getManyAndCount();

    const tagsByItem = await this.findTagsByItemIds(items.map((i) => i.id), organizationId.toString());
    return {
      items: items.map((item) => KnowledgeItemMapper.ormToResponse(item, tagsByItem.get(item.id) ?? [])),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
  private async findTagsByItemIds(itemIds: string[], organizationId: string) {
    const map = new Map<string, Array<{ id: string; name: string; slug: string; category: string; status: string }>>();
    if (!itemIds.length) return map;
    const rows = await this.itemTags.createQueryBuilder('kit')
      .innerJoin(TechnicalTagOrmEntity, 'tt', 'tt.id = kit.tag_id AND tt.organization_id = kit.organization_id')
      .select([
        'kit.knowledge_item_id as knowledgeItemId',
        'tt.id as id',
        'tt.name as name',
        'tt.slug as slug',
        'tt.category as category',
        'tt.status as status',
      ])
      .where('kit.organization_id = :organizationId', { organizationId })
      .andWhere('kit.knowledge_item_id IN (:...itemIds)', { itemIds })
      .getRawMany();
    for (const row of rows) {
      const list = map.get(row.knowledgeItemId) ?? [];
      list.push({ id: row.id, name: row.name, slug: row.slug, category: row.category, status: row.status });
      map.set(row.knowledgeItemId, list);
    }
    return map;
  }
}
