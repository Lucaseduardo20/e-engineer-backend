import { Inject, Injectable } from '@nestjs/common';
import type { Paginated } from '../../../../shared/contracts/dashboard.contracts';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import {
  KNOWLEDGE_ITEM_REPOSITORY,
  type KnowledgeItemRepository,
  type KnowledgeItemResponse,
} from '../../domain/repositories/knowledge-item.repository';
import { KnowledgeItemStatus } from '../../domain/value-objects/knowledge-item-status.vo';
import { KnowledgeItemType } from '../../domain/value-objects/knowledge-item-type.vo';
import { normalizeKnowledgeTags } from '../../domain/value-objects/knowledge-tag.vo';

@Injectable()
export class SearchKnowledgeItemsUseCase {
  constructor(
    @Inject(KNOWLEDGE_ITEM_REPOSITORY)
    private readonly knowledgeItems: KnowledgeItemRepository,
  ) {}

  execute(input: {
    organizationId: string;
    query?: string;
    type?: string;
    status?: string;
    tags?: string[];
    page: number;
    pageSize: number;
  }): Promise<Paginated<KnowledgeItemResponse>> {
    return this.knowledgeItems.search(
      OrganizationId.create(input.organizationId),
      {
        page: input.page,
        pageSize: input.pageSize,
        query: input.query?.trim() || undefined,
        type: input.type ? KnowledgeItemType.create(input.type).value : undefined,
        status: input.status
          ? KnowledgeItemStatus.create(input.status).value
          : 'published',
        tags: normalizeKnowledgeTags(input.tags ?? []),
      },
    );
  }
}
