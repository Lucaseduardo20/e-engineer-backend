import { Inject, Injectable } from '@nestjs/common';
import type { Project as ProjectContract } from '../../../../shared/contracts/dashboard.contracts';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { ProjectStatus } from '../../domain/value-objects/project-status';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from '../../domain/repositories/project.repository';

type UpdateProjectStatusInput = {
  projectId: string;
  organizationId: string;
  status: ProjectContract['status'];
};

const statusMap: Record<ProjectContract['status'], string> = {
  draft: 'draft',
  active: 'active',
  paused: 'on_hold',
  completed: 'completed',
  archived: 'cancelled',
};

@Injectable()
export class UpdateProjectStatusUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(
    input: UpdateProjectStatusInput,
  ): Promise<Result<ProjectContract, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const projectId = new UniqueEntityId(input.projectId);
      const project = await this.projectRepository.findById(
        projectId,
        organizationId,
      );

      if (!project) {
        return Result.fail(new Error('Project not found.'));
      }

      project.updateStatus(ProjectStatus.create(statusMap[input.status]));
      await this.projectRepository.save(project);

      const updated = await this.projectRepository.getById(
        projectId,
        organizationId,
      );

      if (!updated) {
        return Result.fail(new Error('Project not found.'));
      }

      return Result.ok(updated);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
