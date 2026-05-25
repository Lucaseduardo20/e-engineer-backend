import { Inject, Injectable } from '@nestjs/common';
import {
  DOMAIN_EVENT_PUBLISHER,
  type DomainEventPublisher,
} from '../../../../shared/application/ports/domain-event-publisher';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from '../../domain/repositories/project.repository';
import {
  CreateProjectInputDto,
  CreateProjectOutputDto,
} from '../dto/create-project.dto';
import { Project } from '../../domain/entities/project';

@Injectable()
export class CreateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly domainEventPublisher: DomainEventPublisher,
  ) {}

  async execute(
    input: CreateProjectInputDto,
  ): Promise<Result<CreateProjectOutputDto, Error>> {
    try {
      const project = Project.create({
        organizationId: OrganizationId.create(input.organizationId),
        name: input.name,
        projectType: input.projectType,
      });

      await this.projectRepository.save(project);
      await this.domainEventPublisher.publishAll(project.pullDomainEvents());

      return Result.ok({
        id: project.id,
        organizationId: project.organizationId.toString(),
        name: project.name,
        projectType: project.projectType,
        status: project.status.value,
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
