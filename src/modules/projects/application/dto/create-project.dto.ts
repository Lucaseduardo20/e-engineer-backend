import { ProjectStatusValue } from '../../domain/value-objects/project-status';

export interface CreateProjectInputDto {
  organizationId: string;
  name: string;
  projectType: string;
}

export interface CreateProjectOutputDto {
  id: string;
  organizationId: string;
  name: string;
  projectType: string;
  status: ProjectStatusValue;
}
