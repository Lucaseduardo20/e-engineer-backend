import { IsArray, IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  knowledgeItemTypes,
  type KnowledgeItemTypeValue,
} from '../../domain/value-objects/knowledge-item-type.vo';

export class CreateKnowledgeItemDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;

  @IsIn(knowledgeItemTypes)
  type!: KnowledgeItemTypeValue;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown> | null;
}
