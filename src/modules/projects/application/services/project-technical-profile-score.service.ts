import { Injectable } from '@nestjs/common';
import type { ProjectTechnicalProfileTagSource } from '../../domain/repositories/project.repository';
import type { ProjectTechnicalProfileTagDto } from '../dto/project-technical-profile.dto';

const DIRECT_PROJECT_TAG_SCORE = 3;
const DELIVERABLE_TAG_SCORE = 2;

@Injectable()
export class ProjectTechnicalProfileScoreService {
  readonly explanation = 'Tag direta no projeto: +3. Tag em entregavel: +2.';

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

      const score =
        tagSource.source === 'deliverable_tag'
          ? DELIVERABLE_TAG_SCORE
          : DIRECT_PROJECT_TAG_SCORE;
      current.score += score;
      current.sources.push({
        type:
          tagSource.source === 'deliverable_tag'
            ? 'deliverable_tag'
            : 'project_tag',
        score,
      });
      byTagId.set(tagSource.tagId, current);
    }

    return [...byTagId.values()].sort(
      (first, second) =>
        second.score - first.score || first.name.localeCompare(second.name),
    );
  }
}
