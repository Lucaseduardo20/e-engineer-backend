import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import type { PriorityRequest as PriorityRequestContract } from '../../../../shared/contracts/dashboard.contracts';
import {
  PRIORITY_REQUEST_REPOSITORY,
  type PriorityRequestRepository,
} from '../../domain/repositories/priority-request.repository';
import { PriorityRequestMapper } from '../../infrastructure/mappers/priority-request.mapper';

export interface DecidePriorityRequestInput {
  organizationId: string;
  priorityRequestId: string;
  decidedBy: string;
  decision: 'apply' | 'reject';
}

@Injectable()
export class DecidePriorityRequestUseCase {
  constructor(
    @Inject(PRIORITY_REQUEST_REPOSITORY)
    private readonly repository: PriorityRequestRepository,
  ) {}

  async execute(
    input: DecidePriorityRequestInput,
  ): Promise<Result<PriorityRequestContract, Error>> {
    try {
      const priorityRequest = await this.repository.findById(
        input.priorityRequestId,
        OrganizationId.create(input.organizationId),
      );

      if (!priorityRequest) {
        throw new Error('Priority request not found.');
      }

      if (input.decision === 'apply') {
        priorityRequest.apply(input.decidedBy);
      } else {
        priorityRequest.reject(input.decidedBy);
      }

      await this.repository.save(priorityRequest);

      return Result.ok(PriorityRequestMapper.toContract(priorityRequest));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
