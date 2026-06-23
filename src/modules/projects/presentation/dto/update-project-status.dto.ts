import { IsIn } from 'class-validator';
import type { Project } from '../../../../shared/contracts/dashboard.contracts';

const projectStatuses: Array<Project['status']> = [
  'draft',
  'active',
  'paused',
  'completed',
  'archived',
];

export class UpdateProjectStatusDto {
  @IsIn(projectStatuses)
  status!: Project['status'];
}
