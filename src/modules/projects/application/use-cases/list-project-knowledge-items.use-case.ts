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

export interface ProjectKnowledgeItem {
  relationId: string;
  relationType: string;
  linkedAt: string;
  linkedBy: string;
  knowledgeItem: {
    id: string;
    title: string;
    description?: string | null;
    type: string;
    status: string;
    tags: string[];
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

      const relation = detail.relations.find(
        (value) =>
          value.targetType === 'project' && value.targetId === input.projectId,
      );

      if (!relation) continue;

      linked.push({
        relationId: relation.id,
        relationType: relation.relationType,
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

    return { items: linked };
  }
}
