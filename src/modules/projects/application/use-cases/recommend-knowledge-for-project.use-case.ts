import { Inject, Injectable } from '@nestjs/common';
import type { ProjectKnowledgeRecommendation } from '../../../../shared/contracts/dashboard.contracts';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type { KnowledgeItemTypeValue } from '../../../knowledge-base/domain/value-objects/knowledge-item-type.vo';
import {
  KNOWLEDGE_ITEM_REPOSITORY,
  type KnowledgeItemRepository,
} from '../../../knowledge-base/domain/repositories/knowledge-item.repository';
import {
  DELIVERABLE_REPOSITORY,
  type DeliverableRepository,
} from '../../../deliverables/domain/repositories/deliverable.repository';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from '../../domain/repositories/project.repository';
import { ProjectTechnicalProfileScoreService } from '../services/project-technical-profile-score.service';

type GovernedTag = {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
};

@Injectable()
export class RecommendKnowledgeForProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projects: ProjectRepository,
    @Inject(DELIVERABLE_REPOSITORY)
    private readonly deliverables: DeliverableRepository,
    @Inject(KNOWLEDGE_ITEM_REPOSITORY)
    private readonly knowledgeItems: KnowledgeItemRepository,
    private readonly profileScoreService: ProjectTechnicalProfileScoreService,
  ) {}

  async execute(input: {
    organizationId: string;
    projectId: string;
  }): Promise<{ items: ProjectKnowledgeRecommendation[] } | null> {
    const organizationId = OrganizationId.create(input.organizationId);
    const projectId = new UniqueEntityId(input.projectId);
    const project = await this.projects.getById(projectId, organizationId);

    if (!project) {
      return null;
    }

    const deliverablePage = await this.deliverables.list(organizationId, {
      projectId,
      page: 1,
      pageSize: 500,
    });
    const projectDeliverableIds = new Set(
      deliverablePage.items.map((deliverable) => deliverable.id),
    );
    const profileSources = await this.projects.listTechnicalProfileTagSources(
      projectId,
      organizationId,
    );
    const profileTags = this.profileScoreService
      .calculate(profileSources)
      .filter((tag) => tag.status !== 'archived');
    const profileTagsById = new Map(profileTags.map((tag) => [tag.id, tag]));
    const governedTagIds = profileTags.map((tag) => tag.id);

    if (!governedTagIds.length) {
      return { items: [] };
    }

    const [publishedPage, deprecatedPage] = await Promise.all([
      this.knowledgeItems.list(organizationId, {
        page: 1,
        pageSize: 100,
        status: 'published',
        tagIds: governedTagIds,
        includeArchived: false,
      }),
      this.knowledgeItems.list(organizationId, {
        page: 1,
        pageSize: 40,
        status: 'deprecated',
        tagIds: governedTagIds,
        includeArchived: false,
      }),
    ]);
    const candidateIds = [
      ...new Set([
        ...publishedPage.items.map((item) => item.id),
        ...deprecatedPage.items.map((item) => item.id),
      ]),
    ];
    const recommendations: ProjectKnowledgeRecommendation[] = [];

    for (const candidateId of candidateIds) {
      const detail = await this.knowledgeItems.findByIdWithRelations(
        new UniqueEntityId(candidateId),
        organizationId,
      );

      if (!detail || detail.status === 'archived') {
        continue;
      }

      if (!['published', 'deprecated'].includes(detail.status)) {
        continue;
      }

      if (detail.archivedAt) {
        continue;
      }

      const alreadyApplied = detail.relations.some(
        (relation) =>
          (relation.targetType === 'project' &&
            relation.targetId === input.projectId) ||
          (relation.targetType === 'deliverable' &&
            projectDeliverableIds.has(relation.targetId)),
      );

      const matchedTags = detail.tags.filter((tag) =>
        profileTagsById.has(tag.id),
      );

      if (!matchedTags.length) {
        continue;
      }

      const score =
        matchedTags.reduce(
          (total, tag) => total + (profileTagsById.get(tag.id)?.score ?? 0),
          0,
        ) +
        this.projectStatusWeight(project.status, detail.type) +
        this.knowledgeTypeWeight(detail.type) +
        (alreadyApplied ? -5 : 0) +
        (detail.status === 'deprecated' || detail.deprecatedAt ? -8 : 0);
      const tagNames = matchedTags
        .sort(
          (first, second) =>
            (profileTagsById.get(second.id)?.score ?? 0) -
              (profileTagsById.get(first.id)?.score ?? 0) ||
            first.name.localeCompare(second.name),
        )
        .slice(0, 3)
        .map((tag) => tag.name);

      recommendations.push({
        type: this.recommendationType(detail.type),
        knowledgeItem: {
          id: detail.id,
          title: detail.title,
          description: detail.description,
          type: detail.type,
          status: detail.status,
          tags: detail.tags,
          updatedAt: detail.updatedAt,
          publishedAt: detail.publishedAt,
        },
        matchedTags,
        score,
        reason: this.reasonFor({
          matchedTagNames: tagNames,
          alreadyApplied,
          deprecated: detail.status === 'deprecated' || Boolean(detail.deprecatedAt),
          type: detail.type,
        }),
        alreadyApplied,
      });
    }

    return {
      items: recommendations
        .sort((first, second) => {
          if (second.score !== first.score) {
            return second.score - first.score;
          }

          return (
            new Date(second.knowledgeItem.updatedAt).getTime() -
              new Date(first.knowledgeItem.updatedAt).getTime() ||
            first.knowledgeItem.title.localeCompare(second.knowledgeItem.title)
          );
        })
        .slice(0, 8),
    };
  }

  private projectStatusWeight(
    status: string,
    type: KnowledgeItemTypeValue,
  ): number {
    if (
      status === 'draft' &&
      ['document_model', 'project_reference', 'project_template'].includes(type)
    ) {
      return 3;
    }

    if (
      status === 'active' &&
      [
        'technical_standard',
        'review_checklist',
        'delivery_standard',
      ].includes(type)
    ) {
      return 3;
    }

    if (
      status === 'paused' &&
      ['lesson_learned', 'project_reference'].includes(type)
    ) {
      return 2;
    }

    return 0;
  }

  private knowledgeTypeWeight(type: KnowledgeItemTypeValue): number {
    if (type === 'review_checklist') return 4;
    if (type === 'document_model') return 4;
    if (type === 'project_reference' || type === 'project_template') return 3;
    if (type === 'delivery_standard' || type === 'technical_standard') return 2;
    return 0;
  }

  private recommendationType(
    type: KnowledgeItemTypeValue,
  ): ProjectKnowledgeRecommendation['type'] {
    if (type === 'document_model') return 'document_model';
    if (type === 'review_checklist') return 'review_checklist';
    if (type === 'project_reference' || type === 'project_template') {
      return 'project_reference';
    }
    return 'knowledge_item';
  }

  private reasonFor(params: {
    matchedTagNames: string[];
    alreadyApplied: boolean;
    deprecated: boolean;
    type: KnowledgeItemTypeValue;
  }): string {
    const base = params.matchedTagNames.length
      ? `Sugestao baseada no contexto tecnico: ${params.matchedTagNames.join(', ')}.`
      : 'Sugestao baseada no contexto tecnico deste projeto.';
    const typeHint =
      params.type === 'review_checklist'
        ? ' Pode apoiar a revisao tecnica.'
        : params.type === 'document_model'
          ? ' Pode acelerar documentos semelhantes.'
          : '';
    const appliedHint = params.alreadyApplied ? ' Ja esta aplicado ao projeto.' : '';
    const deprecatedHint = params.deprecated ? ' Item depreciado: revise antes de usar.' : '';
    return `${base}${typeHint}${appliedHint}${deprecatedHint}`;
  }
}
