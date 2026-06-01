import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { KnowledgeRelation } from '../../../knowledge-base/domain/entities/knowledge-relation';
import {
  KNOWLEDGE_ITEM_REPOSITORY,
  type KnowledgeItemRepository,
  type KnowledgeRelationResponse,
} from '../../../knowledge-base/domain/repositories/knowledge-item.repository';
import { KnowledgeItemMapper } from '../../../knowledge-base/infrastructure/mappers/knowledge-item.mapper';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from '../../domain/repositories/project.repository';
import { AuditQueryService } from '../../../audit/infrastructure/repositories/audit-query.service';

@Injectable()
export class LinkKnowledgeItemToProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projects: ProjectRepository,
    @Inject(KNOWLEDGE_ITEM_REPOSITORY)
    private readonly knowledgeItems: KnowledgeItemRepository,
    private readonly audit: AuditQueryService,
  ) {}

  async execute(input: {
    organizationId: string;
    projectId: string;
    knowledgeItemId: string;
    relationType: string;
    linkedBy: string;
  }): Promise<Result<KnowledgeRelationResponse, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const projectId = new UniqueEntityId(input.projectId);
      const project = await this.projects.getById(projectId, organizationId);

      if (!project) {
        throw new Error('Project not found.');
      }

      const knowledgeItemId = new UniqueEntityId(input.knowledgeItemId);
      const item = await this.knowledgeItems.findById(
        knowledgeItemId,
        organizationId,
      );

      if (!item) {
        throw new Error('Knowledge item not found.');
      }

      if (item.status.value === 'archived') {
        throw new Error(
          'Itens arquivados nao podem ser vinculados a projetos ativos.',
        );
      }

      const detail = await this.knowledgeItems.findByIdWithRelations(
        knowledgeItemId,
        organizationId,
      );
      const exists = detail?.relations.some(
        (relation) =>
          relation.targetType === 'project' &&
          relation.targetId === input.projectId &&
          relation.relationType === input.relationType,
      );

      if (exists) {
        throw new Error('Knowledge relation already exists for this project.');
      }

      const relation = KnowledgeRelation.create({
        organizationId,
        knowledgeItemId,
        targetType: 'project',
        targetId: projectId,
        relationType: input.relationType,
        createdBy: input.linkedBy,
      });

      await this.knowledgeItems.saveRelation(relation);
      await this.audit.record({
        organizationId: input.organizationId,
        actorName: input.linkedBy,
        action: 'knowledge_item.linked_to_project',
        entityType: 'knowledge_item',
        entityId: input.knowledgeItemId,
        description: `Conhecimento vinculado ao projeto: ${item.title}`,
        metadata: {
          projectId: input.projectId,
          relationType: input.relationType,
        },
      });

      return Result.ok(KnowledgeItemMapper.relationToResponse(relation));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
