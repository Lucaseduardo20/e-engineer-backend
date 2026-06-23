import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { KnowledgeAttachment } from '../../domain/entities/knowledge-attachment';
import { KnowledgeItem } from '../../domain/entities/knowledge-item';
import { KnowledgeRelation } from '../../domain/entities/knowledge-relation';
import type {
  KnowledgeAttachmentResponse,
  KnowledgeItemDetailResponse,
  KnowledgeItemResponse,
  KnowledgeRelationResponse,
} from '../../domain/repositories/knowledge-item.repository';
import { KnowledgeItemStatus } from '../../domain/value-objects/knowledge-item-status.vo';
import { KnowledgeItemType } from '../../domain/value-objects/knowledge-item-type.vo';
import { KnowledgeVisibility } from '../../domain/value-objects/knowledge-visibility.vo';
import { KnowledgeAttachmentOrmEntity } from '../persistence/typeorm/knowledge-attachment.orm-entity';
import { KnowledgeItemOrmEntity } from '../persistence/typeorm/knowledge-item.orm-entity';
import { KnowledgeRelationOrmEntity } from '../persistence/typeorm/knowledge-relation.orm-entity';

export class KnowledgeItemMapper {
  static toOrm(item: KnowledgeItem): KnowledgeItemOrmEntity {
    const orm = new KnowledgeItemOrmEntity();
    orm.id = item.id;
    orm.organizationId = item.organizationId.toString();
    orm.title = item.title;
    orm.description = item.description;
    orm.type = item.type.value;
    orm.status = item.status.value;
    orm.visibility = item.visibility.value;
    orm.tags = item.tags;
    orm.content = item.content;
    orm.createdBy = item.createdBy;
    orm.updatedBy = item.updatedBy;
    orm.publishedAt = item.publishedAt;
    orm.archivedAt = item.archivedAt;
    orm.deprecatedAt = item.deprecatedAt;

    if (item.createdAt) {
      orm.createdAt = item.createdAt;
    }

    if (item.updatedAt) {
      orm.updatedAt = item.updatedAt;
    }

    return orm;
  }

  static toDomain(orm: KnowledgeItemOrmEntity): KnowledgeItem {
    return KnowledgeItem.restore(
      {
        organizationId: OrganizationId.create(orm.organizationId),
        title: orm.title,
        description: orm.description,
        type: KnowledgeItemType.create(orm.type),
        status: KnowledgeItemStatus.create(orm.status),
        visibility: KnowledgeVisibility.create(orm.visibility ?? 'organization'),
        tags: orm.tags ?? [],
        content: orm.content,
        createdBy: orm.createdBy,
        updatedBy: orm.updatedBy,
        publishedAt: orm.publishedAt,
        archivedAt: orm.archivedAt,
        deprecatedAt: orm.deprecatedAt,
        createdAt: orm.createdAt,
        updatedAt: orm.updatedAt,
      },
      new UniqueEntityId(orm.id),
    );
  }

  static toResponse(item: KnowledgeItem, tags: KnowledgeItemResponse['tags'] = []): KnowledgeItemResponse {
    return {
      id: item.id,
      organizationId: item.organizationId.toString(),
      title: item.title,
      description: item.description,
      type: item.type.value,
      status: item.status.value,
      visibility: item.visibility.value,
      tags,
      tagNames: tags.map((t) => t.name),
      tagIds: tags.map((t) => t.id),
      content: item.content,
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
      publishedAt: item.publishedAt?.toISOString() ?? null,
      archivedAt: item.archivedAt?.toISOString() ?? null,
      deprecatedAt: item.deprecatedAt?.toISOString() ?? null,
      createdAt: item.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: item.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  static ormToResponse(orm: KnowledgeItemOrmEntity, tags: KnowledgeItemResponse['tags'] = []): KnowledgeItemResponse {
    return {
      id: orm.id,
      organizationId: orm.organizationId,
      title: orm.title,
      description: orm.description,
      type: KnowledgeItemType.create(orm.type).value,
      status: KnowledgeItemStatus.create(orm.status).value,
      visibility: KnowledgeVisibility.create(orm.visibility ?? 'organization').value,
      tags,
      tagNames: tags.map((t) => t.name),
      tagIds: tags.map((t) => t.id),
      content: orm.content,
      createdBy: orm.createdBy,
      updatedBy: orm.updatedBy,
      publishedAt: orm.publishedAt?.toISOString() ?? null,
      archivedAt: orm.archivedAt?.toISOString() ?? null,
      deprecatedAt: orm.deprecatedAt?.toISOString() ?? null,
      createdAt: orm.createdAt.toISOString(),
      updatedAt: orm.updatedAt.toISOString(),
    };
  }

  static ormToDetail(orm: KnowledgeItemOrmEntity, tags: KnowledgeItemResponse['tags'] = []): KnowledgeItemDetailResponse {
    return {
      ...this.ormToResponse(orm, tags),
      relations: (orm.relations ?? []).map(this.ormRelationToResponse),
      attachments: (orm.attachments ?? []).map(this.ormAttachmentToResponse),
    };
  }

  static relationToOrm(
    relation: KnowledgeRelation,
  ): KnowledgeRelationOrmEntity {
    const orm = new KnowledgeRelationOrmEntity();
    orm.id = relation.id;
    orm.organizationId = relation.organizationId.toString();
    orm.knowledgeItemId = relation.knowledgeItemId.toString();
    orm.targetType = relation.targetType;
    orm.targetId = relation.targetId.toString();
    orm.relationType = relation.relationType;
    orm.createdBy = relation.createdBy;
    orm.createdAt = relation.createdAt;
    return orm;
  }

  static relationToResponse(
    relation: KnowledgeRelation,
  ): KnowledgeRelationResponse {
    return {
      id: relation.id,
      organizationId: relation.organizationId.toString(),
      knowledgeItemId: relation.knowledgeItemId.toString(),
      targetType: relation.targetType,
      targetId: relation.targetId.toString(),
      relationType: relation.relationType,
      createdBy: relation.createdBy,
      createdAt: relation.createdAt.toISOString(),
    };
  }

  static ormRelationToResponse(
    relation: KnowledgeRelationOrmEntity,
  ): KnowledgeRelationResponse {
    return {
      id: relation.id,
      organizationId: relation.organizationId,
      knowledgeItemId: relation.knowledgeItemId,
      targetType: relation.targetType,
      targetId: relation.targetId,
      relationType: relation.relationType,
      createdBy: relation.createdBy,
      createdAt: relation.createdAt.toISOString(),
    };
  }

  static attachmentToOrm(
    attachment: KnowledgeAttachment,
  ): KnowledgeAttachmentOrmEntity {
    const orm = new KnowledgeAttachmentOrmEntity();
    orm.id = attachment.id;
    orm.organizationId = attachment.organizationId.toString();
    orm.knowledgeItemId = attachment.knowledgeItemId.toString();
    orm.fileId = attachment.fileId.toString();
    orm.label = attachment.label;
    orm.description = attachment.description;
    orm.createdBy = attachment.createdBy;
    orm.createdAt = attachment.createdAt;
    return orm;
  }

  static ormAttachmentToResponse(
    attachment: KnowledgeAttachmentOrmEntity,
  ): KnowledgeAttachmentResponse {
    return {
      id: attachment.id,
      organizationId: attachment.organizationId,
      knowledgeItemId: attachment.knowledgeItemId,
      fileId: attachment.fileId,
      label: attachment.label,
      description: attachment.description,
      createdBy: attachment.createdBy,
      createdAt: attachment.createdAt.toISOString(),
    };
  }
}
