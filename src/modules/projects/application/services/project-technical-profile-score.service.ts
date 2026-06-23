import { Injectable } from '@nestjs/common';
import type { ProjectTechnicalProfileTagSource } from '../../domain/repositories/project.repository';
import type { ProjectTechnicalProfileTagDto } from '../dto/project-technical-profile.dto';

const DIRECT_PROJECT_TAG_SCORE = 3;
const DELIVERABLE_TAG_SCORE = 2;
const DOCUMENT_TAG_SCORE = 1;
const OFFICIAL_DOCUMENT_SCORE = 3;

@Injectable()
export class ProjectTechnicalProfileScoreService {
  readonly explanation =
    'Tag direta no projeto: +3. Tag em entregavel: +2. Tag em documento: +1. Documento oficial: +3.';

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

      const score = this.scoreForSource(tagSource.source);
      current.score += score;
      current.sources.push({
        type: this.typeForSource(tagSource.source),
        score,
      });
      byTagId.set(tagSource.tagId, current);
    }

    return [...byTagId.values()].sort(
      (first, second) =>
        second.score - first.score || first.name.localeCompare(second.name),
    );
  }

  private scoreForSource(source: string): number {
    if (source === 'deliverable_tag') return DELIVERABLE_TAG_SCORE;
    if (source === 'document_tag') return DOCUMENT_TAG_SCORE;
    if (source === 'official_document') return OFFICIAL_DOCUMENT_SCORE;
    return DIRECT_PROJECT_TAG_SCORE;
  }

  private typeForSource(
    source: string,
  ): ProjectTechnicalProfileTagDto['sources'][number]['type'] {
    if (source === 'deliverable_tag') return 'deliverable_tag';
    if (source === 'document_tag') return 'document_tag';
    if (source === 'official_document') return 'official_document';
    return 'project_tag';
  }
}
