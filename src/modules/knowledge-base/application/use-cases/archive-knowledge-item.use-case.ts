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

@Injectable()
export class ArchiveKnowledgeItemUseCase {
  constructor(
    @Inject(KNOWLEDGE_ITEM_REPOSITORY)
    private readonly knowledgeItems: KnowledgeItemRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly events: DomainEventPublisher,
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

      return Result.ok(KnowledgeItemMapper.toResponse(item));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
