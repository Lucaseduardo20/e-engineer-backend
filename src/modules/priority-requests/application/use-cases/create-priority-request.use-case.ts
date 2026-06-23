import { Inject, Injectable } from '@nestjs/common';
import { AuthorizationService } from '../../../../shared/application/authorization/authorization.service';
import { permissions } from '../../../../shared/application/authorization/permissions';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import type { PriorityRequest as PriorityRequestContract } from '../../../../shared/contracts/dashboard.contracts';
import { PriorityRequest } from '../../domain/entities/priority-request';
import {
  PRIORITY_REQUEST_REPOSITORY,
  type PriorityRequestRepository,
} from '../../domain/repositories/priority-request.repository';
import { PriorityRequestMapper } from '../../infrastructure/mappers/priority-request.mapper';

export interface CreatePriorityRequestInput {
  organizationId: string;
  requestedBy: string;
  actorRoles: string[];
  actorIsPlatformAdmin?: boolean;
  targetType: string;
  targetId: string;
  requestedForUserId?: string | null;
  priority: string;
  reason?: string | null;
}

@Injectable()
export class CreatePriorityRequestUseCase {
  constructor(
    @Inject(PRIORITY_REQUEST_REPOSITORY)
    private readonly repository: PriorityRequestRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    input: CreatePriorityRequestInput,
  ): Promise<Result<PriorityRequestContract, Error>> {
    try {
      const canApply = this.authorizationService.hasPermission(
        {
          roles: input.actorRoles,
          isPlatformAdmin: input.actorIsPlatformAdmin,
        },
        permissions.priority.apply,
      );
      const priorityRequest = PriorityRequest.create({
        organizationId: OrganizationId.create(input.organizationId),
        targetType: input.targetType,
        targetId: input.targetId,
        requestedBy: input.requestedBy,
        requestedForUserId: input.requestedForUserId,
        priority: input.priority,
        reason: input.reason,
        autoApply: canApply,
      });

      await this.repository.save(priorityRequest);

      return Result.ok(PriorityRequestMapper.toContract(priorityRequest));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
