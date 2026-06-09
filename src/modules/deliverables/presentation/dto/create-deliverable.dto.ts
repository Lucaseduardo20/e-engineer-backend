import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  deliverableTypeValues,
  type DeliverableTypeValue,
} from '../../domain/value-objects/deliverable-type.value-object';
import type { DeliverableStatusValue } from '../../domain/value-objects/deliverable-status.value-object';

const deliverableStatusValues: DeliverableStatusValue[] = [
  'todo',
  'in_progress',
  'done',
  'blocked',
];

export class CreateDeliverableDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsIn(deliverableStatusValues)
  status?: DeliverableStatusValue;

  @IsIn(deliverableTypeValues)
  type!: DeliverableTypeValue;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  assignees?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @IsUUID(undefined, { each: true })
  tagIds?: string[];
}
