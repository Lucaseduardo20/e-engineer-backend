import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Project } from '../entities/project';

export const PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY');

export interface ProjectRepository {
  save(project: Project): Promise<void>;
  findById(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<Project | null>;
}
