import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import {
  KNOWLEDGE_ITEM_REPOSITORY,
  type KnowledgeItemRepository,
} from '../../../knowledge-base/domain/repositories/knowledge-item.repository';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from '../../domain/repositories/project.repository';
import { KnowledgeItemDetailResponseDto } from 'src/modules/knowledge-base/presentation/dto/knowledge-item-detail-response.dto';
import {
  DELIVERABLE_REPOSITORY,
  type DeliverableRepository,
} from '../../../deliverables/domain/repositories/deliverable.repository';

export interface ProjectKnowledgeItem {
  relationId: string;
  relationType: string;
  targetType: string;
  targetId: string;
  linkedAt: string;
  linkedBy: string;
  knowledgeItem: {
    id: string;
    title: string;
    description?: string | null;
    type: string;
    status: string;
    tags: Record<string, unknown>[];
    updatedAt: string;
    publishedAt?: string | null;
    archivedAt?: string | null;
    deprecatedAt?: string | null;
  };
}

@Injectable()
export class ListProjectKnowledgeItemsUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projects: ProjectRepository,
    @Inject(KNOWLEDGE_ITEM_REPOSITORY)
    private readonly knowledgeItems: KnowledgeItemRepository,
    @Inject(DELIVERABLE_REPOSITORY)
    private readonly deliverables: DeliverableRepository,
  ) {}

  async execute(input: {
    organizationId: string;
    projectId: string;
  }): Promise<{ items: ProjectKnowledgeItem[] } | null> {
    const organizationId = OrganizationId.create(input.organizationId);
    const project = await this.projects.getById(
      new UniqueEntityId(input.projectId),
      organizationId,
    );

    if (!project) {
      return null;
    }

    const deliverablePage = await this.deliverables.list(organizationId, {
      projectId: new UniqueEntityId(input.projectId),
      page: 1,
      pageSize: 500,
    });
    const projectDeliverableIds = new Set(
      deliverablePage.items.map((deliverable) => deliverable.id),
    );
    const page = await this.knowledgeItems.list(organizationId, {
      page: 1,
      pageSize: 100,
      includeArchived: true,
    });

    const linked: ProjectKnowledgeItem[] = [];

    for (const item of page.items) {
      const detail = (await this.knowledgeItems.findByIdWithRelations(
        new UniqueEntityId(item.id),
        organizationId,
      )) as KnowledgeItemDetailResponseDto;

      if (!detail) continue;

      const relations = detail.relations.filter(
        (value) =>
          (value.targetType === 'project' &&
            value.targetId === input.projectId) ||
          (value.targetType === 'deliverable' &&
            projectDeliverableIds.has(value.targetId)),
      );

      for (const relation of relations) {
        linked.push({
          relationId: relation.id,
          relationType: relation.relationType,
          targetType: relation.targetType,
          targetId: relation.targetId,
          linkedAt: relation.createdAt,
          linkedBy: relation.createdBy,
          knowledgeItem: {
            id: detail.id,
            title: detail.title,
            description: detail.description,
            type: detail.type,
            status: detail.status,
            tags: detail.tags,
            updatedAt: detail.updatedAt,
            publishedAt: detail.publishedAt,
            archivedAt: detail.archivedAt,
            deprecatedAt: detail.deprecatedAt,
          },
        });
      }
    }

    return { items: linked };
  }
}
