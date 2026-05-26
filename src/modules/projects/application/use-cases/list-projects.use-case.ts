import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import type {
  Paginated,
  Project,
} from '../../../../shared/contracts/dashboard.contracts';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from '../../domain/repositories/project.repository';

@Injectable()
export class ListProjectsUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
  ) {}

  execute(input: {
    organizationId: string;
    page: number;
    pageSize: number;
  }): Promise<Paginated<Project>> {
    return this.projectRepository.list(
      OrganizationId.create(input.organizationId),
      {
        page: input.page,
        pageSize: input.pageSize,
      },
    );
  }
}
