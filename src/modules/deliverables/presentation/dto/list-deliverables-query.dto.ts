import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../shared/presentation/pagination-query.dto';
import type { DeliverableStatusValue } from '../../domain/value-objects/deliverable-status.value-object';

const deliverableStatusValues: DeliverableStatusValue[] = [
  'todo',
  'in_progress',
  'done',
  'blocked',
];

export class ListDeliverablesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsIn(deliverableStatusValues)
  status?: DeliverableStatusValue;
}
