import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type { Project } from '../../../../shared/contracts/dashboard.contracts';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from '../../domain/repositories/project.repository';

@Injectable()
export class GetProjectDetailUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
  ) {}

  execute(input: {
    projectId: string;
    organizationId: string;
  }): Promise<Project | null> {
    return this.projectRepository.getById(
      new UniqueEntityId(input.projectId),
      OrganizationId.create(input.organizationId),
    );
  }
}
