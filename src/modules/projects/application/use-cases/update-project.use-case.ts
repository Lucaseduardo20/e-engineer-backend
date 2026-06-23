import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type { Project } from '../../../../shared/contracts/dashboard.contracts';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from '../../domain/repositories/project.repository';

export interface UpdateProjectInput {
  organizationId: string;
  projectId: string;
  name?: string;
  projectType?: string;
  tagIds?: string[];
  updatedBy?: string;
}

@Injectable()
export class UpdateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(input: UpdateProjectInput): Promise<Result<Project, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const projectId = new UniqueEntityId(input.projectId);
      const project = await this.projectRepository.findById(
        projectId,
        organizationId,
      );

      if (!project) {
        throw new Error('Project not found.');
      }

      const tagIds = input.tagIds
        ? [...new Set(input.tagIds)].filter(Boolean)
        : input.tagIds;

      if (tagIds !== undefined) {
        await this.projectRepository.ensureSelectableTags({
          organizationId,
          tagIds,
        });
      }

      project.updateDetails({
        name: input.name,
        projectType: input.projectType,
      });

      await this.projectRepository.save(project);

      if (tagIds !== undefined) {
        await this.projectRepository.syncTags({
          projectId,
          organizationId,
          tagIds,
          actorId: input.updatedBy ?? 'system',
        });
      }

      const updated = await this.projectRepository.getById(
        projectId,
        organizationId,
      );

      if (!updated) {
        throw new Error('Project not found.');
      }

      return Result.ok(updated);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
