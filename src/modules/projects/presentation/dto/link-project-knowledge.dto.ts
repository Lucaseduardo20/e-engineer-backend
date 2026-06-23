import { IsIn, IsOptional, IsUUID } from 'class-validator';
import {
  knowledgeRelationTypes,
  type KnowledgeRelationType,
} from '../../../knowledge-base/domain/entities/knowledge-relation';

export class LinkProjectKnowledgeDto {
  @IsUUID()
  knowledgeItemId!: string;

  @IsIn(knowledgeRelationTypes)
  relationType!: KnowledgeRelationType;

  @IsOptional()
  @IsUUID()
  deliverableId?: string;
}
