import { Inject, Injectable } from '@nestjs/common';
import type { Deliverable } from '../../../../shared/contracts/dashboard.contracts';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import {
  DELIVERABLE_REPOSITORY,
  type DeliverableRepository,
} from '../../domain/repositories/deliverable.repository';

@Injectable()
export class MarkDeliverableInheritanceReviewedUseCase {
  constructor(
    @Inject(DELIVERABLE_REPOSITORY)
    private readonly deliverableRepository: DeliverableRepository,
  ) {}

  async execute(input: {
    organizationId: string;
    deliverableId: string;
    reviewedBy: string;
  }): Promise<Result<Deliverable, Error>> {
    try {
      const deliverable =
        await this.deliverableRepository.markInheritanceReviewed({
          organizationId: OrganizationId.create(input.organizationId),
          deliverableId: new UniqueEntityId(input.deliverableId),
          reviewedBy: input.reviewedBy,
        });

      if (!deliverable) {
        throw new Error('Inherited deliverable not found.');
      }

      return Result.ok(deliverable);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
