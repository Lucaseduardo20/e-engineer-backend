import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import {
  KNOWLEDGE_ITEM_REPOSITORY,
  type KnowledgeItemRepository,
  type KnowledgeItemResponse,
} from '../../domain/repositories/knowledge-item.repository';
import { KnowledgeItemMapper } from '../../infrastructure/mappers/knowledge-item.mapper';

export interface UpdateKnowledgeItemInput {
  organizationId: string;
  itemId: string;
  updatedBy: string;
  title?: string;
  description?: string | null;
  tags?: string[];
  content?: Record<string, unknown> | null;
}

@Injectable()
export class UpdateKnowledgeItemUseCase {
  constructor(
    @Inject(KNOWLEDGE_ITEM_REPOSITORY)
    private readonly knowledgeItems: KnowledgeItemRepository,
  ) {}

  async execute(
    input: UpdateKnowledgeItemInput,
  ): Promise<Result<KnowledgeItemResponse, Error>> {
    try {
      const item = await this.knowledgeItems.findById(
        new UniqueEntityId(input.itemId),
        OrganizationId.create(input.organizationId),
      );

      if (!item) {
        throw new Error('Knowledge item not found.');
      }

      item.update(input);
      await this.knowledgeItems.save(item);

      return Result.ok(KnowledgeItemMapper.toResponse(item));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
