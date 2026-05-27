import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../shared/presentation/pagination-query.dto';
import type { Project } from '../../../../shared/contracts/dashboard.contracts';

const projectStatuses: Array<Project['status']> = [
  'draft',
  'active',
  'paused',
  'completed',
  'archived',
];

export class ListProjectsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn(projectStatuses)
  status?: Project['status'];
}
