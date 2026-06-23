import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DecideReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
