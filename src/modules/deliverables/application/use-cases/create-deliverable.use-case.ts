import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Deliverable } from '../../domain/entities/deliverable';
import {
  DELIVERABLE_REPOSITORY,
  type DeliverableRepository,
} from '../../domain/repositories/deliverable.repository';
import { DeliverableStatus } from '../../domain/value-objects/deliverable-status.value-object';
import { DeliverableType } from '../../domain/value-objects/deliverable-type.value-object';
import { DeliverableMapper } from '../../infrastructure/mappers/deliverable.mapper';
import { DeliverableResponseDto } from '../../presentation/dto/deliverable-response.dto';

export interface CreateDeliverableInput {
  organizationId: string;
  projectId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status?: string;
  type: string;
  assignees?: string[];
  tagIds?: string[];
  createdBy?: string;
}

@Injectable()
export class CreateDeliverableUseCase {
  constructor(
    @Inject(DELIVERABLE_REPOSITORY)
    private readonly deliverableRepository: DeliverableRepository,
  ) {}

  async execute(
    input: CreateDeliverableInput,
  ): Promise<Result<DeliverableResponseDto, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const projectId = new UniqueEntityId(input.projectId);
      const projectExists = await this.deliverableRepository.projectExists(
        projectId,
        organizationId,
      );

      if (!projectExists) {
        throw new Error('Project not found.');
      }

      if (input.tagIds) {
        await this.deliverableRepository.ensureSelectableTags({
          organizationId,
          tagIds: input.tagIds,
        });
      }

      const deliverable = Deliverable.create({
        organizationId,
        projectId,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
        status: input.status
          ? DeliverableStatus.create(input.status)
          : DeliverableStatus.todo(),
        type: DeliverableType.create(input.type),
        assignees: input.assignees,
      });

      await this.deliverableRepository.save(deliverable);
      if (input.tagIds) {
        await this.deliverableRepository.syncTags({
          deliverableId: new UniqueEntityId(deliverable.id),
          organizationId,
          tagIds: input.tagIds,
          actorId: input.createdBy ?? 'system',
        });
      }

      const persisted = await this.deliverableRepository.getById(
        new UniqueEntityId(deliverable.id),
        organizationId,
      );

      return Result.ok(persisted ?? DeliverableMapper.toResponse(deliverable));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
