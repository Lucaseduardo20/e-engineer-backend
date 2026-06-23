import { IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class PromoteProjectToKnowledgeDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  tagIds?: string[];

  @IsString()
  @MaxLength(4000)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  whenToUse?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  warnings?: string;
}
