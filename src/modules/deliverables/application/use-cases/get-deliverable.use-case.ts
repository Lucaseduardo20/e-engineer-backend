import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type { Deliverable } from '../../../../shared/contracts/dashboard.contracts';
import {
  DELIVERABLE_REPOSITORY,
  type DeliverableRepository,
} from '../../domain/repositories/deliverable.repository';

@Injectable()
export class GetDeliverableUseCase {
  constructor(
    @Inject(DELIVERABLE_REPOSITORY)
    private readonly deliverableRepository: DeliverableRepository,
  ) {}

  execute(input: {
    organizationId: string;
    deliverableId: string;
  }): Promise<Deliverable | null> {
    return this.deliverableRepository.getById(
      new UniqueEntityId(input.deliverableId),
      OrganizationId.create(input.organizationId),
    );
  }
}
