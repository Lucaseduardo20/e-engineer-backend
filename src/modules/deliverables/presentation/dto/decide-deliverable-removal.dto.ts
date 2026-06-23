import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DecideDeliverableRemovalDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string | null;
}
