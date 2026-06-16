import { Injectable } from '@nestjs/common';
import type { ProjectTechnicalProfileTagSource } from '../../domain/repositories/project.repository';
import type { ProjectTechnicalProfileTagDto } from '../dto/project-technical-profile.dto';

const DIRECT_PROJECT_TAG_SCORE = 3;

@Injectable()
export class ProjectTechnicalProfileScoreService {
  readonly explanation = 'Tag direta no projeto: +3.';

  calculate(
    tagSources: ProjectTechnicalProfileTagSource[],
  ): ProjectTechnicalProfileTagDto[] {
    const byTagId = new Map<string, ProjectTechnicalProfileTagDto>();

    for (const tagSource of tagSources) {
      const current = byTagId.get(tagSource.tagId) ?? {
        id: tagSource.tagId,
        name: tagSource.name,
        slug: tagSource.slug,
        category: tagSource.category,
        status: tagSource.status,
        score: 0,
        sources: [],
      };

      current.score += DIRECT_PROJECT_TAG_SCORE;
      current.sources.push({
        type: 'project_tag',
        score: DIRECT_PROJECT_TAG_SCORE,
      });
      byTagId.set(tagSource.tagId, current);
    }

    return [...byTagId.values()].sort(
      (first, second) =>
        second.score - first.score || first.name.localeCompare(second.name),
    );
  }
}
