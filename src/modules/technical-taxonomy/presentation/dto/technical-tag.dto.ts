import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { TECHNICAL_TAG_CATEGORIES, type TechnicalTagCategoryValue } from '../../domain/value-objects/technical-tag-category.vo';
import { TECHNICAL_TAG_STATUSES, type TechnicalTagStatusValue } from '../../domain/value-objects/technical-tag-status.vo';

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'sim'].includes(v)) return true;
    if (['0', 'false', 'no', 'nao', 'não'].includes(v)) return false;
  }
  return undefined;
}

export class CreateTechnicalTagDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsIn(TECHNICAL_TAG_CATEGORIES)
  category!: TechnicalTagCategoryValue;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateTechnicalTagDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn(TECHNICAL_TAG_CATEGORIES)
  category?: TechnicalTagCategoryValue;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsIn(TECHNICAL_TAG_STATUSES)
  status?: TechnicalTagStatusValue;
}

export class ListTechnicalTagsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(TECHNICAL_TAG_CATEGORIES)
  category?: TechnicalTagCategoryValue;

  @IsOptional()
  @IsIn(TECHNICAL_TAG_STATUSES)
  status?: TechnicalTagStatusValue;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  includeArchived?: boolean;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(1)
  @Max(100)
  limit = 20;
}

export class TechnicalTagIdParamDto {
  @IsUUID()
  id!: string;
}
