import type { TechnicalTagResponse } from '../../domain/repositories/technical-tag.repository';
import { TechnicalTag } from '../../domain/entities/technical-tag';

export class TechnicalTagResponseMapper {
  static toResponse(tag: TechnicalTag, usageCount = 0): TechnicalTagResponse {
    return {
      id: tag.id,
      organizationId: tag.organizationId.toString(),
      name: tag.name,
      slug: tag.slug,
      category: tag.category.value,
      description: tag.description,
      status: tag.status.value,
      usageCount,
      createdBy: tag.createdBy,
      updatedBy: tag.updatedBy,
      archivedAt: tag.archivedAt,
      deprecatedAt: tag.deprecatedAt,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }
}
