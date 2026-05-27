import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type {
  Deliverable,
  Paginated,
} from '../../../../shared/contracts/dashboard.contracts';
import {
  DELIVERABLE_REPOSITORY,
  type DeliverableRepository,
} from '../../domain/repositories/deliverable.repository';

@Injectable()
export class ListDeliverablesUseCase {
  constructor(
    @Inject(DELIVERABLE_REPOSITORY)
    private readonly deliverableRepository: DeliverableRepository,
  ) {}

  execute(input: {
    organizationId: string;
    projectId?: string;
    page: number;
    pageSize: number;
    status?: Deliverable['status'];
  }): Promise<Paginated<Deliverable>> {
    return this.deliverableRepository.list(
      OrganizationId.create(input.organizationId),
      {
        projectId: input.projectId
          ? new UniqueEntityId(input.projectId)
          : undefined,
        page: input.page,
        pageSize: input.pageSize,
        status: input.status,
      },
    );
  }
}
