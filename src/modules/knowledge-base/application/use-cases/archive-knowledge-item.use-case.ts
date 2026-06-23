import { Inject, Injectable } from '@nestjs/common';
import {
  DOMAIN_EVENT_PUBLISHER,
  type DomainEventPublisher,
} from '../../../../shared/application/ports/domain-event-publisher';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import {
  KNOWLEDGE_ITEM_REPOSITORY,
  type KnowledgeItemRepository,
  type KnowledgeItemResponse,
} from '../../domain/repositories/knowledge-item.repository';
import { KnowledgeItemMapper } from '../../infrastructure/mappers/knowledge-item.mapper';
import { AuditQueryService } from '../../../audit/infrastructure/repositories/audit-query.service';

@Injectable()
export class ArchiveKnowledgeItemUseCase {
  constructor(
    @Inject(KNOWLEDGE_ITEM_REPOSITORY)
    private readonly knowledgeItems: KnowledgeItemRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly events: DomainEventPublisher,
    private readonly audit: AuditQueryService,
  ) {}

  async execute(input: {
    organizationId: string;
    itemId: string;
    archivedBy: string;
  }): Promise<Result<KnowledgeItemResponse, Error>> {
    try {
      const item = await this.knowledgeItems.findById(
        new UniqueEntityId(input.itemId),
        OrganizationId.create(input.organizationId),
      );

      if (!item) {
        throw new Error('Knowledge item not found.');
      }

      item.archive(input.archivedBy);
      await this.knowledgeItems.save(item);
      await this.events.publishAll(item.pullDomainEvents());
      await this.audit.record({
        organizationId: input.organizationId,
        actorName: input.archivedBy,
        action: 'knowledge_item.archived',
        entityType: 'knowledge_item',
        entityId: item.id,
        description: `Item de conhecimento arquivado: ${item.title}`,
      });

      return Result.ok(KnowledgeItemMapper.toResponse(item));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
