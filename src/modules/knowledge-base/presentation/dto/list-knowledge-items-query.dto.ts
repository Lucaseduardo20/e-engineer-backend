import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../shared/presentation/pagination-query.dto';
import {
  knowledgeItemStatuses,
  type KnowledgeItemStatusValue,
} from '../../domain/value-objects/knowledge-item-status.vo';
import {
  knowledgeItemTypes,
  type KnowledgeItemTypeValue,
} from '../../domain/value-objects/knowledge-item-type.vo';

function splitCsv(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(',')).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').filter(Boolean);
  }

  return undefined;
}

export class ListKnowledgeItemsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(knowledgeItemTypes)
  type?: KnowledgeItemTypeValue;

  @IsOptional()
  @IsIn(knowledgeItemStatuses)
  status?: KnowledgeItemStatusValue;

  @IsOptional()
  @Transform(({ value }) => splitCsv(value))
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class SearchKnowledgeItemsQueryDto extends ListKnowledgeItemsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}
