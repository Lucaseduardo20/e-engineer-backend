import { IsString, MaxLength, MinLength } from 'class-validator';

export class RequestDeliverableRemovalDto {
  @IsString()
  @MinLength(12)
  @MaxLength(1000)
  reason!: string;
}
