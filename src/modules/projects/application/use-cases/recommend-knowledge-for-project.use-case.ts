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
    const governedTags = new Map<string, GovernedTag>();

    for (const deliverable of deliverablePage.items) {
      for (const tag of deliverable.tags ?? []) {
        if (tag.status === 'active') {
          governedTags.set(tag.id, tag);
        }
      }
    }

    const governedTagIds = [...governedTags.keys()];

    if (!governedTagIds.length) {
      return { items: [] };
    }

    const candidatePage = await this.knowledgeItems.list(organizationId, {
      page: 1,
      pageSize: 100,
      status: 'published',
      tagIds: governedTagIds,
      includeArchived: false,
    });
    const recommendations: ProjectKnowledgeRecommendation[] = [];

    for (const candidate of candidatePage.items) {
      const detail = await this.knowledgeItems.findByIdWithRelations(
        new UniqueEntityId(candidate.id),
        organizationId,
      );

      if (!detail || detail.status !== 'published') {
        continue;
      }

      if (detail.archivedAt || detail.deprecatedAt) {
        continue;
      }

      const alreadyApplied = detail.relations.some(
        (relation) =>
          (relation.targetType === 'project' &&
            relation.targetId === input.projectId) ||
          (relation.targetType === 'deliverable' &&
            projectDeliverableIds.has(relation.targetId)),
      );

      if (alreadyApplied) {
        continue;
      }

      const matchedTags = detail.tags.filter((tag) =>
        governedTags.has(tag.id),
      );

      if (!matchedTags.length) {
        continue;
      }

      const score =
        matchedTags.length * 10 +
        this.projectStatusWeight(project.status, detail.type);

      recommendations.push({
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
        reason: `Combina com ${matchedTags.length} tag(s) tecnica(s) dos entregaveis: ${matchedTags
          .map((tag) => tag.name)
          .join(', ')}.`,
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
            new Date(first.knowledgeItem.updatedAt).getTime()
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
}
