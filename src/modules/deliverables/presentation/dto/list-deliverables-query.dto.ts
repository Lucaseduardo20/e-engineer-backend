import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../shared/presentation/pagination-query.dto';

export class ListDeliverablesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;
}
