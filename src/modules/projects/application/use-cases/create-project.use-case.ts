import { Inject, Injectable } from '@nestjs/common';
import {
  DOMAIN_EVENT_PUBLISHER,
  type DomainEventPublisher,
} from '../../../../shared/application/ports/domain-event-publisher';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from '../../domain/repositories/project.repository';
import {
  CreateProjectInputDto,
  CreateProjectOutputDto,
} from '../dto/create-project.dto';
import { Project } from '../../domain/entities/project';
import {
  PROJECT_BASE_STRUCTURE_REPOSITORY,
  type ProjectBaseStructureRepository,
} from '../ports/project-base-structure.repository';

@Injectable()
export class CreateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly domainEventPublisher: DomainEventPublisher,
    @Inject(PROJECT_BASE_STRUCTURE_REPOSITORY)
    private readonly projectBaseStructure: ProjectBaseStructureRepository,
  ) {}

  async execute(
    input: CreateProjectInputDto,
  ): Promise<Result<CreateProjectOutputDto, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const tagIds = input.tagIds
        ? [...new Set(input.tagIds)].filter(Boolean)
        : undefined;

      if (tagIds) {
        await this.projectRepository.ensureSelectableTags({
          organizationId,
          tagIds,
        });
      }

      const project = Project.create({
        organizationId,
        name: input.name,
        projectType: input.projectType,
      });

      await this.projectRepository.save(project);
      if (tagIds) {
        await this.projectRepository.syncTags({
          projectId: new UniqueEntityId(project.id),
          organizationId,
          tagIds,
          actorId: input.createdBy ?? 'system',
        });
      }

      let clonedStructure: CreateProjectOutputDto['clonedStructure'] = null;
      if (input.baseProjectId) {
        const baseProjectId = new UniqueEntityId(input.baseProjectId);
        const baseExists = await this.projectBaseStructure.baseProjectExists({
          organizationId,
          baseProjectId,
        });

        if (!baseExists) {
          throw new Error('Base project not found.');
        }

        const copied = await this.projectBaseStructure.copyDeliverablesOnly({
          organizationId,
          baseProjectId,
          targetProjectId: new UniqueEntityId(project.id),
          actorId: input.createdBy ?? 'system',
        });
        await this.projectBaseStructure.saveBaseRelation({
          organizationId,
          baseProjectId,
          targetProjectId: new UniqueEntityId(project.id),
          inheritTags: false,
          inheritDeliverables: true,
          actorId: input.createdBy ?? 'system',
        });
        clonedStructure = {
          deliverablesCopied: copied.deliverablesCopied,
          documentsCopied: 0,
          documentVersionsCopied: 0,
          reviewsCopied: 0,
        };
      }
      await this.domainEventPublisher.publishAll(project.pullDomainEvents());

      return Result.ok({
        id: project.id,
        organizationId: project.organizationId.toString(),
        name: project.name,
        projectType: project.projectType,
        status: project.status.value,
        tagIds: tagIds ?? [],
        clonedFromProjectId: input.baseProjectId ?? null,
        clonedStructure,
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
