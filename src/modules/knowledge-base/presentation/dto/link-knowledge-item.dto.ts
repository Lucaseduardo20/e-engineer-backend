import { IsIn, IsString, IsUUID } from 'class-validator';
import {
  knowledgeRelationTargetTypes,
  knowledgeRelationTypes,
  type KnowledgeRelationTargetType,
  type KnowledgeRelationType,
} from '../../domain/entities/knowledge-relation';

export class LinkKnowledgeItemDto {
  @IsIn(knowledgeRelationTargetTypes)
  targetType!: KnowledgeRelationTargetType;

  @IsUUID()
  targetId!: string;

  @IsIn(knowledgeRelationTypes)
  relationType!: KnowledgeRelationType;
}
