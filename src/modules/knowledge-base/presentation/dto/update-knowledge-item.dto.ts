import { IsArray, IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsUUID } from 'class-validator';
import {
  knowledgeItemTypes,
  type KnowledgeItemTypeValue,
} from '../../domain/value-objects/knowledge-item-type.vo';

export class UpdateKnowledgeItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;

  @IsOptional()
  @IsIn(knowledgeItemTypes)
  type?: KnowledgeItemTypeValue;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown> | null;
}
