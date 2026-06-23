import { ProjectStatusValue } from '../../domain/value-objects/project-status';

export interface CreateProjectInputDto {
  organizationId: string;
  name: string;
  projectType: string;
  baseProjectId?: string;
  createdBy?: string;
  tagIds?: string[];
}

export interface CreateProjectOutputDto {
  id: string;
  organizationId: string;
  name: string;
  projectType: string;
  status: ProjectStatusValue;
  tagIds?: string[];
  clonedFromProjectId?: string | null;
  clonedStructure?: {
    deliverablesCopied: number;
    documentsCopied: number;
    documentVersionsCopied: number;
    reviewsCopied: number;
  } | null;
}
