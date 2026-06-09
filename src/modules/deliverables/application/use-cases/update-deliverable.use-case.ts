import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import {
  DELIVERABLE_REPOSITORY,
  type DeliverableRepository,
} from '../../domain/repositories/deliverable.repository';
import { DeliverableStatus } from '../../domain/value-objects/deliverable-status.value-object';
import { DeliverableType } from '../../domain/value-objects/deliverable-type.value-object';
import { DeliverableMapper } from '../../infrastructure/mappers/deliverable.mapper';
import { DeliverableResponseDto } from '../../presentation/dto/deliverable-response.dto';

export interface UpdateDeliverableInput {
  organizationId: string;
  deliverableId: string;
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  status?: string;
  type?: string;
  assignees?: string[];
  tagIds?: string[];
  updatedBy?: string;
}

@Injectable()
export class UpdateDeliverableUseCase {
  constructor(
    @Inject(DELIVERABLE_REPOSITORY)
    private readonly deliverableRepository: DeliverableRepository,
  ) {}

  async execute(
    input: UpdateDeliverableInput,
  ): Promise<Result<DeliverableResponseDto, Error>> {
    try {
      const deliverable = await this.deliverableRepository.findById(
        new UniqueEntityId(input.deliverableId),
        OrganizationId.create(input.organizationId),
      );

      if (!deliverable) {
        throw new Error('Deliverable not found.');
      }

      deliverable.update({
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
        status: input.status
          ? DeliverableStatus.create(input.status)
          : undefined,
        type: input.type ? DeliverableType.create(input.type) : undefined,
        assignees: input.assignees,
      });

      await this.deliverableRepository.save(deliverable);
      if (input.tagIds) {
        await this.deliverableRepository.syncTags({
          deliverableId: new UniqueEntityId(deliverable.id),
          organizationId: OrganizationId.create(input.organizationId),
          tagIds: input.tagIds,
          actorId: input.updatedBy ?? 'system',
        });
      }

      return Result.ok(DeliverableMapper.toResponse(deliverable));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
