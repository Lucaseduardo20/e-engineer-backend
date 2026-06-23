import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class RecommendProjectBasesDto {
  @IsArray()
  @ArrayMaxSize(40)
  @IsUUID('4', { each: true })
  tagIds!: string[];

  @IsOptional()
  @Min(1)
  @Max(12)
  limit?: number;
}
