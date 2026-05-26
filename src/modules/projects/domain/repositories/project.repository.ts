import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Project } from '../entities/project';
import type {
  Paginated,
  Project as ProjectContract,
} from '../../../../shared/contracts/dashboard.contracts';

export const PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY');

export interface ProjectRepository {
  save(project: Project): Promise<void>;
  list(
    organizationId: OrganizationId,
    params: { page: number; pageSize: number },
  ): Promise<Paginated<ProjectContract>>;
  getById(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<ProjectContract | null>;
  findById(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<Project | null>;
}
