import { IsString, MaxLength } from 'class-validator';

export class CreateReviewCommentDto {
  @IsString()
  @MaxLength(2000)
  body!: string;
}
