import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import {
  DELIVERABLE_REPOSITORY,
  type DeliverableRepository,
} from '../../domain/repositories/deliverable.repository';

@Injectable()
export class DeleteDeliverableUseCase {
  constructor(
    @Inject(DELIVERABLE_REPOSITORY)
    private readonly deliverableRepository: DeliverableRepository,
  ) {}

  async execute(input: {
    organizationId: string;
    deliverableId: string;
  }): Promise<Result<{ deleted: true }, Error>> {
    try {
      const deleted = await this.deliverableRepository.delete({
        organizationId: OrganizationId.create(input.organizationId),
        deliverableId: new UniqueEntityId(input.deliverableId),
      });

      if (!deleted) {
        throw new Error('Deliverable not found.');
      }

      return Result.ok({ deleted: true });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
