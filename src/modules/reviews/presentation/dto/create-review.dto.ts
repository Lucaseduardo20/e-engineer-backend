import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsUUID()
  deliverableId?: string;

  @IsOptional()
  @IsUUID()
  documentId?: string;

  @IsOptional()
  @IsUUID()
  documentVersionId?: string;

  @IsArray()
  @ArrayMaxSize(12)
  @IsUUID(undefined, { each: true })
  reviewers!: string[];

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
