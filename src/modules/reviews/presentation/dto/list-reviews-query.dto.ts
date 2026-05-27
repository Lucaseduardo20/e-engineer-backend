import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../shared/presentation/pagination-query.dto';
import {
  reviewStatusValues,
  type ReviewStatusValue,
} from '../../domain/value-objects/review-status.vo';

export class ListReviewsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  deliverableId?: string;

  @IsOptional()
  @IsUUID()
  documentId?: string;

  @IsOptional()
  @IsIn(reviewStatusValues)
  status?: ReviewStatusValue;
}
