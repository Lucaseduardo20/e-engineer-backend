import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterReviewLessonDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsString()
  @MaxLength(4000)
  context!: string;

  @IsString()
  @MaxLength(4000)
  identifiedProblem!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  impact?: string;

  @IsString()
  @MaxLength(4000)
  recommendation!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  riskObservation?: string;
}

