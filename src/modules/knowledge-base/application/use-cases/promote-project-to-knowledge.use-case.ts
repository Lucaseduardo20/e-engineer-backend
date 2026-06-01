import { Inject, Injectable } from '@nestjs/common';
import {
  DOMAIN_EVENT_PUBLISHER,
  type DomainEventPublisher,
} from '../../../../shared/application/ports/domain-event-publisher';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { KnowledgeItem } from '../../domain/entities/knowledge-item';
import { KnowledgeRelation } from '../../domain/entities/knowledge-relation';
import { ProjectPromotedToKnowledgeEvent } from '../../domain/events/project-promoted-to-knowledge.event';
import {
  KNOWLEDGE_ITEM_REPOSITORY,
  type KnowledgeItemRepository,
  type KnowledgeItemResponse,
} from '../../domain/repositories/knowledge-item.repository';
import { KnowledgeItemType } from '../../domain/value-objects/knowledge-item-type.vo';
import { KnowledgeItemMapper } from '../../infrastructure/mappers/knowledge-item.mapper';
import { AuditQueryService } from '../../../audit/infrastructure/repositories/audit-query.service';

@Injectable()
export class PromoteProjectToKnowledgeUseCase {
  constructor(
    @Inject(KNOWLEDGE_ITEM_REPOSITORY)
    private readonly knowledgeItems: KnowledgeItemRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly events: DomainEventPublisher,
    private readonly audit: AuditQueryService,
  ) {}

  async execute(input: {
    organizationId: string;
    projectId: string;
    createdBy: string;
    title: string;
    description?: string | null;
    tags?: string[];
    reason: string;
    whenToUse?: string;
    warnings?: string;
  }): Promise<Result<KnowledgeItemResponse, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const projectId = new UniqueEntityId(input.projectId);
      const projectExists = await this.knowledgeItems.targetExists({
        organizationId,
        targetType: 'project',
        targetId: projectId,
      });

      if (!projectExists) {
        throw new Error('Project not found.');
      }
      if (!input.title?.trim()) {
        throw new Error('Title is required.');
      }
      if (!input.reason?.trim()) {
        throw new Error('Reason is required.');
      }

      const item = KnowledgeItem.create({
        organizationId,
        createdBy: input.createdBy,
        title: input.title,
        description: input.description,
        type: KnowledgeItemType.create('project_reference'),
        tags: input.tags,
        content: {
          summary: `Referencia criada a partir do projeto ${input.title.trim()}.`,
          sections: [
            { title: 'Motivo da promocao', body: input.reason.trim() },
            {
              title: 'Quando usar esta referencia',
              body: input.whenToUse?.trim() || 'Nao informado.',
            },
            {
              title: 'Alertas e observacoes',
              body: input.warnings?.trim() || 'Nenhum alerta informado.',
            },
          ],
          checklist: [],
          metadata: {
            source: 'project',
            sourceProjectId: input.projectId,
          },
        },
      });
      const relation = KnowledgeRelation.create({
        organizationId,
        knowledgeItemId: new UniqueEntityId(item.id),
        targetType: 'project',
        targetId: projectId,
        relationType: 'based_on',
        createdBy: input.createdBy,
      });

      await this.knowledgeItems.save(item);
      await this.knowledgeItems.saveRelation(relation);
      await this.events.publishAll([
        ...item.pullDomainEvents(),
        new ProjectPromotedToKnowledgeEvent({
          aggregateId: item.id,
          organizationId: organizationId.toString(),
          projectId: input.projectId,
        }),
      ]);
      await this.audit.record({
        organizationId: input.organizationId,
        actorName: input.createdBy,
        action: 'knowledge_item.created_from_project',
        entityType: 'knowledge_item',
        entityId: item.id,
        description: `Projeto promovido como referencia: ${input.title}`,
        metadata: { sourceProjectId: input.projectId, knowledgeItemType: 'project_reference' },
      });

      return Result.ok(KnowledgeItemMapper.toResponse(item));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
