import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { TechnicalTag } from '../entities/technical-tag';
import type { TechnicalTagCategoryValue } from '../value-objects/technical-tag-category.vo';
import type { TechnicalTagStatusValue } from '../value-objects/technical-tag-status.vo';

export const TECHNICAL_TAG_REPOSITORY = Symbol('TECHNICAL_TAG_REPOSITORY');

export interface FindTechnicalTagsParams {
  organizationId: string;
  search?: string;
  category?: TechnicalTagCategoryValue;
  status?: TechnicalTagStatusValue;
  includeArchived?: boolean;
  page?: number;
  limit?: number;
}

export interface TechnicalTagResponse {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  category: TechnicalTagCategoryValue;
  description: string | null;
  status: TechnicalTagStatusValue;
  usageCount: number;
  createdBy: string;
  updatedBy: string | null;
  archivedAt: Date | null;
  deprecatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TechnicalTagRepository {
  save(tag: TechnicalTag): Promise<void>;
  findById(
    id: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<TechnicalTag | null>;
  findBySlug(
    slug: string,
    organizationId: OrganizationId,
  ): Promise<TechnicalTag | null>;
  existsBySlug(slug: string, organizationId: OrganizationId): Promise<boolean>;
  findMany(filters: FindTechnicalTagsParams): Promise<TechnicalTag[]>;
  count(filters: FindTechnicalTagsParams): Promise<number>;
  countUsageByTagIds(
    tagIds: string[],
    organizationId: OrganizationId,
  ): Promise<Map<string, number>>;
}
