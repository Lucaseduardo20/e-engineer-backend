import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import type { PriorityRequest as PriorityRequestContract } from '../../../../shared/contracts/dashboard.contracts';
import {
  PRIORITY_REQUEST_REPOSITORY,
  type PriorityRequestRepository,
} from '../../domain/repositories/priority-request.repository';
import { PriorityRequestMapper } from '../../infrastructure/mappers/priority-request.mapper';

@Injectable()
export class ListPriorityRequestsUseCase {
  constructor(
    @Inject(PRIORITY_REQUEST_REPOSITORY)
    private readonly repository: PriorityRequestRepository,
  ) {}

  async execute(input: {
    organizationId: string;
  }): Promise<PriorityRequestContract[]> {
    const priorityRequests = await this.repository.list(
      OrganizationId.create(input.organizationId),
    );

    return priorityRequests.map(PriorityRequestMapper.toContract);
  }
}
