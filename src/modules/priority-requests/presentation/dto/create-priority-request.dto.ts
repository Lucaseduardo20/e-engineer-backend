import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import {
  priorityLevels,
  priorityTargetTypes,
  type PriorityLevel,
  type PriorityTargetType,
} from '../../domain/entities/priority-request';

export class CreatePriorityRequestDto {
  @IsIn(priorityTargetTypes)
  targetType!: PriorityTargetType;

  @IsUUID()
  targetId!: string;

  @IsOptional()
  @IsUUID()
  requestedForUserId?: string | null;

  @IsIn(priorityLevels)
  priority!: PriorityLevel;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string | null;
}
