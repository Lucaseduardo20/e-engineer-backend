import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import {
  PROJECT_BASE_STRUCTURE_REPOSITORY,
  type ProjectBaseStructureRepository,
  type ProjectBaseRecommendation,
} from '../ports/project-base-structure.repository';

@Injectable()
export class RecommendProjectBasesByTagsUseCase {
  constructor(
    @Inject(PROJECT_BASE_STRUCTURE_REPOSITORY)
    private readonly projectBaseStructure: ProjectBaseStructureRepository,
  ) {}

  async execute(input: {
    organizationId: string;
    tagIds: string[];
    limit?: number;
  }): Promise<{ items: ProjectBaseRecommendation[] }> {
    const tagIds = [...new Set(input.tagIds)].filter(Boolean);

    if (!tagIds.length) {
      return { items: [] };
    }

    return {
      items: await this.projectBaseStructure.recommendByTags({
        organizationId: OrganizationId.create(input.organizationId),
        tagIds,
        limit: input.limit ?? 6,
      }),
    };
  }
}
