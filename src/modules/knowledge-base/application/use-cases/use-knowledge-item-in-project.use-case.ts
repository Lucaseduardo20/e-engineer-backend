import { Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import type { KnowledgeRelationResponse } from '../../domain/repositories/knowledge-item.repository';
import { LinkKnowledgeItemUseCase } from './link-knowledge-item.use-case';

@Injectable()
export class UseKnowledgeItemInProjectUseCase {
  constructor(private readonly linkKnowledgeItem: LinkKnowledgeItemUseCase) {}

  execute(input: {
    organizationId: string;
    itemId: string;
    projectId: string;
    usedBy: string;
  }): Promise<Result<KnowledgeRelationResponse, Error>> {
    return this.linkKnowledgeItem.execute({
      organizationId: input.organizationId,
      itemId: input.itemId,
      targetType: 'project',
      targetId: input.projectId,
      relationType: 'used_in',
      linkedBy: input.usedBy,
    });
  }
}
