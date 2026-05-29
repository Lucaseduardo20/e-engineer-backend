import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { KnowledgeRelation } from '../../domain/entities/knowledge-relation';
import {
  KNOWLEDGE_ITEM_REPOSITORY,
  type KnowledgeItemRepository,
  type KnowledgeRelationResponse,
} from '../../domain/repositories/knowledge-item.repository';
import { KnowledgeItemMapper } from '../../infrastructure/mappers/knowledge-item.mapper';

@Injectable()
export class LinkKnowledgeItemUseCase {
  constructor(
    @Inject(KNOWLEDGE_ITEM_REPOSITORY)
    private readonly knowledgeItems: KnowledgeItemRepository,
  ) {}

  async execute(input: {
    organizationId: string;
    itemId: string;
    targetType: string;
    targetId: string;
    relationType: string;
    linkedBy: string;
  }): Promise<Result<KnowledgeRelationResponse, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const itemId = new UniqueEntityId(input.itemId);
      const item = await this.knowledgeItems.findById(itemId, organizationId);

      if (!item) {
        throw new Error('Knowledge item not found.');
      }

      const targetId = new UniqueEntityId(input.targetId);
      const relation = KnowledgeRelation.create({
        organizationId,
        knowledgeItemId: itemId,
        targetType: input.targetType,
        targetId,
        relationType: input.relationType,
        createdBy: input.linkedBy,
      });

      const targetExists = await this.knowledgeItems.targetExists({
        organizationId,
        targetType: relation.targetType,
        targetId,
      });

      if (!targetExists) {
        throw new Error('Knowledge relation target not found.');
      }

      await this.knowledgeItems.saveRelation(relation);

      return Result.ok(KnowledgeItemMapper.relationToResponse(relation));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
