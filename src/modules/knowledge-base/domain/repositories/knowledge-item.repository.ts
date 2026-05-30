import type { Paginated } from '../../../../shared/contracts/dashboard.contracts';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { KnowledgeAttachment } from '../entities/knowledge-attachment';
import { KnowledgeItem } from '../entities/knowledge-item';
import { KnowledgeRelation } from '../entities/knowledge-relation';
import type { KnowledgeItemStatusValue } from '../value-objects/knowledge-item-status.vo';
import type { KnowledgeItemTypeValue } from '../value-objects/knowledge-item-type.vo';
import type { KnowledgeVisibilityValue } from '../value-objects/knowledge-visibility.vo';

export const KNOWLEDGE_ITEM_REPOSITORY = Symbol('KNOWLEDGE_ITEM_REPOSITORY');

export interface KnowledgeItemResponse {
  id: string;
  organizationId: string;
  title: string;
  description?: string | null;
  type: KnowledgeItemTypeValue;
  status: KnowledgeItemStatusValue;
  visibility: KnowledgeVisibilityValue;
  tags: string[];
  content?: Record<string, unknown> | null;
  createdBy: string;
  updatedBy: string;
  publishedAt?: string | null;
  archivedAt?: string | null;
  deprecatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeRelationResponse {
  id: string;
  organizationId: string;
  knowledgeItemId: string;
  targetType: string;
  targetId: string;
  relationType: string;
  createdBy: string;
  createdAt: string;
}

export interface KnowledgeAttachmentResponse {
  id: string;
  organizationId: string;
  knowledgeItemId: string;
  fileId: string;
  label: string;
  description?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface KnowledgeItemDetailResponse extends KnowledgeItemResponse {
  relations: KnowledgeRelationResponse[];
  attachments: KnowledgeAttachmentResponse[];
}

export interface ListKnowledgeItemsParams {
  page: number;
  pageSize: number;
  type?: KnowledgeItemTypeValue;
  status?: KnowledgeItemStatusValue;
  tags?: string[];
  includeArchived?: boolean;
}

export interface SearchKnowledgeItemsParams extends ListKnowledgeItemsParams {
  query?: string;
}

export interface KnowledgeItemRepository {
  save(item: KnowledgeItem): Promise<void>;
  findById(
    itemId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<KnowledgeItem | null>;
  findByIdWithRelations(
    itemId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<KnowledgeItemDetailResponse | null>;
  list(
    organizationId: OrganizationId,
    params: ListKnowledgeItemsParams,
  ): Promise<Paginated<KnowledgeItemResponse>>;
  search(
    organizationId: OrganizationId,
    params: SearchKnowledgeItemsParams,
  ): Promise<Paginated<KnowledgeItemResponse>>;
  saveRelation(relation: KnowledgeRelation): Promise<void>;
  saveAttachment(attachment: KnowledgeAttachment): Promise<void>;
  targetExists(params: {
    organizationId: OrganizationId;
    targetType: string;
    targetId: UniqueEntityId;
  }): Promise<boolean>;
}
