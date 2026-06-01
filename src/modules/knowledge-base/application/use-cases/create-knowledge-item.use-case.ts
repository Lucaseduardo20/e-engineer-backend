import { Inject, Injectable } from '@nestjs/common';
import {
  DOMAIN_EVENT_PUBLISHER,
  type DomainEventPublisher,
} from '../../../../shared/application/ports/domain-event-publisher';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { KnowledgeItem } from '../../domain/entities/knowledge-item';
import {
  KNOWLEDGE_ITEM_REPOSITORY,
  type KnowledgeItemRepository,
  type KnowledgeItemResponse,
} from '../../domain/repositories/knowledge-item.repository';
import { KnowledgeItemType } from '../../domain/value-objects/knowledge-item-type.vo';
import { KnowledgeItemMapper } from '../../infrastructure/mappers/knowledge-item.mapper';
import { AuditQueryService } from '../../../audit/infrastructure/repositories/audit-query.service';

export interface CreateKnowledgeItemInput {
  organizationId: string;
  createdBy: string;
  title: string;
  description?: string | null;
  type: string;
  tags?: string[];
  content?: Record<string, unknown> | null;
}

@Injectable()
export class CreateKnowledgeItemUseCase {
  constructor(
    @Inject(KNOWLEDGE_ITEM_REPOSITORY)
    private readonly knowledgeItems: KnowledgeItemRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly events: DomainEventPublisher,
    private readonly audit: AuditQueryService,
  ) {}

  async execute(
    input: CreateKnowledgeItemInput,
  ): Promise<Result<KnowledgeItemResponse, Error>> {
    try {
      const item = KnowledgeItem.create({
        organizationId: OrganizationId.create(input.organizationId),
        createdBy: input.createdBy,
        title: input.title,
        description: input.description,
        type: KnowledgeItemType.create(input.type),
        tags: input.tags,
        content: input.content,
      });

      await this.knowledgeItems.save(item);
      await this.events.publishAll(item.pullDomainEvents());
      await this.audit.record({
        organizationId: input.organizationId,
        actorName: input.createdBy,
        action: 'knowledge_item.created',
        entityType: 'knowledge_item',
        entityId: item.id,
        description: `Item de conhecimento criado: ${item.title}`,
        metadata: { knowledgeItemType: item.type.value, knowledgeItemStatus: item.status.value },
      });

      return Result.ok(KnowledgeItemMapper.toResponse(item));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
