import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import {
  KNOWLEDGE_ITEM_REPOSITORY,
  type KnowledgeItemRepository,
} from '../../domain/repositories/knowledge-item.repository';

@Injectable()
export class UnlinkKnowledgeItemUseCase {
  constructor(
    @Inject(KNOWLEDGE_ITEM_REPOSITORY)
    private readonly knowledgeItems: KnowledgeItemRepository,
  ) {}

  async execute(input: {
    organizationId: string;
    itemId: string;
    relationId: string;
  }): Promise<Result<{ removed: true }, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const itemId = new UniqueEntityId(input.itemId);

      const item = await this.knowledgeItems.findById(itemId, organizationId);

      if (!item) {
        throw new Error('Knowledge item not found.');
      }

      await this.knowledgeItems.removeRelation({
        relationId: new UniqueEntityId(input.relationId),
        knowledgeItemId: itemId,
        organizationId,
      });

      return Result.ok({ removed: true });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
