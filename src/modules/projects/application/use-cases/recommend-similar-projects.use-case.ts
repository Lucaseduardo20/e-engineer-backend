import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from '../../domain/repositories/project.repository';
import {
  PROJECT_BASE_STRUCTURE_REPOSITORY,
  type ProjectBaseStructureRepository,
  type SimilarProjectRecommendation,
} from '../ports/project-base-structure.repository';

@Injectable()
export class RecommendSimilarProjectsUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_BASE_STRUCTURE_REPOSITORY)
    private readonly projectBaseStructure: ProjectBaseStructureRepository,
  ) {}

  async execute(input: {
    organizationId: string;
    tagIds: string[];
    limit?: number;
  }): Promise<{ items: SimilarProjectRecommendation[] }> {
    const organizationId = OrganizationId.create(input.organizationId);
    const tagIds = [...new Set(input.tagIds)].filter(Boolean);

    if (!tagIds.length) {
      return { items: [] };
    }

    await this.projectRepository.ensureSelectableTags({
      organizationId,
      tagIds,
    });

    return {
      items: await this.projectBaseStructure.recommendSimilarProjects({
        organizationId,
        tagIds,
        limit: Math.min(Math.max(input.limit ?? 6, 1), 12),
      }),
    };
  }
}
