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
export class PublishKnowledgeItemUseCase {

  private validateMinimumFieldsForPublication(params: {
    title: string;
    type: string;
    createdBy: string;
    organizationId: string;
    description: string | null;
    content: Record<string, unknown> | null;
  }): void {
    const hasContentSummary =
      !!params.content &&
      typeof params.content.summary === 'string' &&
      params.content.summary.trim().length > 0;

    if (
      !params.title.trim() ||
      !params.type ||
      !params.createdBy.trim() ||
      !params.organizationId ||
      (!params.description?.trim() && !hasContentSummary)
    ) {
      throw new Error(
        'Nao e possivel publicar este item. Preencha as informacoes minimas obrigatorias.',
      );
    }
  }

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
    publishedBy: string;
  }): Promise<Result<KnowledgeItemResponse, Error>> {
    try {
      const item = await this.knowledgeItems.findById(
        new UniqueEntityId(input.itemId),
        OrganizationId.create(input.organizationId),
      );

      if (!item) {
        throw new Error('Knowledge item not found.');
      }

      this.validateMinimumFieldsForPublication({
        title: item.title,
        type: item.type.value,
        createdBy: item.createdBy,
        organizationId: item.organizationId.toString(),
        description: item.description,
        content: item.content,
      });

      item.publish(input.publishedBy);
      await this.knowledgeItems.save(item);
      await this.events.publishAll(item.pullDomainEvents());
      await this.audit.record({
        organizationId: input.organizationId,
        actorName: input.publishedBy,
        action: 'knowledge_item.published',
        entityType: 'knowledge_item',
        entityId: item.id,
        description: `Item de conhecimento publicado: ${item.title}`,
      });

      return Result.ok(KnowledgeItemMapper.toResponse(item));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
