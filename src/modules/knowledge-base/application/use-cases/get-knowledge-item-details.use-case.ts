import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import {
  KNOWLEDGE_ITEM_REPOSITORY,
  type KnowledgeItemDetailResponse,
  type KnowledgeItemRepository,
} from '../../domain/repositories/knowledge-item.repository';

@Injectable()
export class GetKnowledgeItemDetailsUseCase {
  constructor(
    @Inject(KNOWLEDGE_ITEM_REPOSITORY)
    private readonly knowledgeItems: KnowledgeItemRepository,
  ) {}

  execute(input: {
    organizationId: string;
    itemId: string;
  }): Promise<KnowledgeItemDetailResponse | null> {
    return this.knowledgeItems.findByIdWithRelations(
      new UniqueEntityId(input.itemId),
      OrganizationId.create(input.organizationId),
    );
  }
}
