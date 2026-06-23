import { Inject, Injectable } from '@nestjs/common';
import {
  DOMAIN_EVENT_PUBLISHER,
  type DomainEventPublisher,
} from '../../../../shared/application/ports/domain-event-publisher';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Project } from '../../domain/entities/project';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from '../../domain/repositories/project.repository';
import {
  PROJECT_BASE_STRUCTURE_REPOSITORY,
  type ProjectBaseStructureRepository,
} from '../ports/project-base-structure.repository';

export interface CreateProjectFromBaseProjectInput {
  organizationId: string;
  baseProjectId: string;
  name: string;
  client?: string | null;
  description?: string | null;
  projectType?: string;
  tagIds?: string[];
  inheritTags?: boolean;
  inheritDeliverables?: boolean;
  deliverablesToInherit?: string[];
  createdBy?: string;
}

export interface CreateProjectFromBaseProjectOutput {
  id: string;
  organizationId: string;
  name: string;
  projectType: string;
  status: string;
  client?: string | null;
  baseProjectId: string;
  inheritedTags: boolean;
  inheritedDeliverables: boolean;
  tagIds: string[];
  deliverablesCopied: number;
}

@Injectable()
export class CreateProjectFromBaseProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_BASE_STRUCTURE_REPOSITORY)
    private readonly projectBaseStructure: ProjectBaseStructureRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly domainEventPublisher: DomainEventPublisher,
  ) {}

  async execute(
    input: CreateProjectFromBaseProjectInput,
  ): Promise<Result<CreateProjectFromBaseProjectOutput, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const baseProjectId = new UniqueEntityId(input.baseProjectId);
      const baseExists = await this.projectBaseStructure.baseProjectExists({
        organizationId,
        baseProjectId,
      });

      if (!baseExists) {
        throw new Error('Base project not found.');
      }

      const inheritedTagIds =
        input.inheritTags === false
          ? []
          : await this.projectBaseStructure.listBaseProjectTagIds({
              organizationId,
              baseProjectId,
            });
      const selectedTagIds = [...new Set(input.tagIds ?? [])].filter(Boolean);
      const tagIds = [...new Set([...inheritedTagIds, ...selectedTagIds])];

      if (tagIds.length) {
        await this.projectRepository.ensureSelectableTags({
          organizationId,
          tagIds,
        });
      }

      const inheritDeliverables = input.inheritDeliverables === true;
      const deliverablesToInherit = [
        ...new Set(input.deliverablesToInherit ?? []),
      ].filter(Boolean);
      const shouldCopyDeliverables =
        inheritDeliverables || deliverablesToInherit.length > 0;

      if (!inheritDeliverables && deliverablesToInherit.length) {
        await this.projectBaseStructure.ensureDeliverablesBelongToBase({
          organizationId,
          baseProjectId,
          deliverableIds: deliverablesToInherit,
        });
      }

      const project = Project.create({
        organizationId,
        name: input.name,
        projectType: input.projectType?.trim() || 'projeto tecnico',
        client: input.client ?? input.description ?? null,
      });

      await this.projectRepository.save(project);

      if (tagIds.length) {
        await this.projectRepository.syncTags({
          projectId: new UniqueEntityId(project.id),
          organizationId,
          tagIds,
          actorId: input.createdBy ?? 'system',
        });
      }

      const copied = inheritDeliverables
        ? await this.projectBaseStructure.copyDeliverablesOnly({
            organizationId,
            baseProjectId,
            targetProjectId: new UniqueEntityId(project.id),
            actorId: input.createdBy ?? 'system',
          })
        : deliverablesToInherit.length
          ? await this.projectBaseStructure.copyDeliverablesOnly({
              organizationId,
              baseProjectId,
              targetProjectId: new UniqueEntityId(project.id),
              deliverableIds: deliverablesToInherit,
              actorId: input.createdBy ?? 'system',
            })
        : { deliverablesCopied: 0 };

      await this.projectBaseStructure.saveBaseRelation({
        organizationId,
        baseProjectId,
        targetProjectId: new UniqueEntityId(project.id),
        inheritTags: input.inheritTags !== false,
        inheritDeliverables: shouldCopyDeliverables,
        actorId: input.createdBy ?? 'system',
      });
      await this.domainEventPublisher.publishAll(project.pullDomainEvents());

      return Result.ok({
        id: project.id,
        organizationId: project.organizationId.toString(),
        name: project.name,
        projectType: project.projectType,
        status: project.status.value,
        client: project.client,
        baseProjectId: input.baseProjectId,
        inheritedTags: input.inheritTags !== false,
        inheritedDeliverables: shouldCopyDeliverables,
        tagIds,
        deliverablesCopied: copied.deliverablesCopied,
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
