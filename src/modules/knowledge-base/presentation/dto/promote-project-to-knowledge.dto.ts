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
  @IsUUID('4', { each: true })
  selectedDeliverableIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lessonsLearned?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  warnings?: string[];
}
