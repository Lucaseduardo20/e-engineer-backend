import { IsArray, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

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
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown> | null;
}
