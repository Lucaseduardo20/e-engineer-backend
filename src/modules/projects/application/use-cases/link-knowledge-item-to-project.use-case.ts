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
import {
  DELIVERABLE_REPOSITORY,
  type DeliverableRepository,
} from '../../../deliverables/domain/repositories/deliverable.repository';

@Injectable()
export class LinkKnowledgeItemToProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projects: ProjectRepository,
    @Inject(KNOWLEDGE_ITEM_REPOSITORY)
    private readonly knowledgeItems: KnowledgeItemRepository,
    @Inject(DELIVERABLE_REPOSITORY)
    private readonly deliverables: DeliverableRepository,
    private readonly audit: AuditQueryService,
  ) {}

  async execute(input: {
    organizationId: string;
    projectId: string;
    knowledgeItemId: string;
    relationType: string;
    linkedBy: string;
    deliverableId?: string;
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

      const target = await this.resolveTarget({
        organizationId,
        projectId: input.projectId,
        deliverableId: input.deliverableId,
      });
      const detail = await this.knowledgeItems.findByIdWithRelations(
        knowledgeItemId,
        organizationId,
      );
      const exists = detail?.relations.some(
        (relation) =>
          relation.targetType === target.targetType &&
          relation.targetId === target.targetId.toString() &&
          relation.relationType === input.relationType,
      );

      if (exists) {
        throw new Error('Knowledge relation already exists for this target.');
      }

      const relation = KnowledgeRelation.create({
        organizationId,
        knowledgeItemId,
        targetType: target.targetType,
        targetId: target.targetId,
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
          deliverableId: input.deliverableId ?? null,
          targetType: target.targetType,
          targetId: target.targetId.toString(),
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

  private async resolveTarget(input: {
    organizationId: OrganizationId;
    projectId: string;
    deliverableId?: string;
  }): Promise<{
    targetType: 'project' | 'deliverable';
    targetId: UniqueEntityId;
  }> {
    if (!input.deliverableId) {
      return {
        targetType: 'project',
        targetId: new UniqueEntityId(input.projectId),
      };
    }

    const deliverable = await this.deliverables.getById(
      new UniqueEntityId(input.deliverableId),
      input.organizationId,
    );

    if (!deliverable || deliverable.projectId !== input.projectId) {
      throw new Error('Deliverable not found for this project.');
    }

    return {
      targetType: 'deliverable',
      targetId: new UniqueEntityId(input.deliverableId),
    };
  }
}
