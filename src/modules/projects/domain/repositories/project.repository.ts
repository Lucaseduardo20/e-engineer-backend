import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Project } from '../entities/project';
import type {
  Paginated,
  Project as ProjectContract,
} from '../../../../shared/contracts/dashboard.contracts';

export const PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY');

export interface ListProjectsParams {
  page: number;
  pageSize: number;
  name?: string;
  status?: ProjectContract['status'];
}

export interface ProjectTechnicalProfileTagSource {
  tagId: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  source: string;
}

export interface ProjectRepository {
  save(project: Project): Promise<void>;
  syncTags(params: {
    projectId: UniqueEntityId;
    organizationId: OrganizationId;
    tagIds: string[];
    actorId: string;
  }): Promise<void>;
  ensureSelectableTags(params: {
    organizationId: OrganizationId;
    tagIds: string[];
  }): Promise<void>;
  list(
    organizationId: OrganizationId,
    params: ListProjectsParams,
  ): Promise<Paginated<ProjectContract>>;
  getById(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<ProjectContract | null>;
  findById(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<Project | null>;
  listTechnicalProfileTagSources(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<ProjectTechnicalProfileTagSource[]>;
}
