import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
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

export class UpdateDeliverableDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsIn(deliverableStatusValues)
  status?: DeliverableStatusValue;

  @IsOptional()
  @IsIn(deliverableTypeValues)
  type?: DeliverableTypeValue;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  assignees?: string[];
}
