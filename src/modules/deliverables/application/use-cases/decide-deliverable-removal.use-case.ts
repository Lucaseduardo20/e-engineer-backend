import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditQueryService } from '../../../audit/infrastructure/repositories/audit-query.service';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import {
  DELIVERABLE_REPOSITORY,
  type DeliverableRepository,
} from '../../domain/repositories/deliverable.repository';
import { DeliverableRemovalRequestOrmEntity } from '../../infrastructure/persistence/typeorm/deliverable-removal-request.orm-entity';
import {
  mapRemovalRequest,
  type DeliverableRemovalRequestResponse,
} from './request-deliverable-removal.use-case';

function hasRemovalApprovalAuthority(roles: string[], isPlatformAdmin?: boolean) {
  return (
    isPlatformAdmin === true ||
    roles.some((role) => ['owner', 'admin', 'manager'].includes(role))
  );
}

@Injectable()
export class DecideDeliverableRemovalUseCase {
  constructor(
    @Inject(DELIVERABLE_REPOSITORY)
    private readonly deliverables: DeliverableRepository,
    @InjectRepository(DeliverableRemovalRequestOrmEntity)
    private readonly removalRequests: Repository<DeliverableRemovalRequestOrmEntity>,
    private readonly audit: AuditQueryService,
  ) {}

  async execute(input: {
    organizationId: string;
    requestId: string;
    decidedBy: string;
    actorRoles: string[];
    actorIsPlatformAdmin?: boolean;
    decision: 'approve' | 'reject';
    comment?: string | null;
  }): Promise<Result<DeliverableRemovalRequestResponse, Error>> {
    try {
      if (
        !hasRemovalApprovalAuthority(input.actorRoles, input.actorIsPlatformAdmin)
      ) {
        throw new Error('Only users with approval authority can decide removal requests.');
      }

      const request = await this.removalRequests.findOne({
        where: {
          id: input.requestId,
          organizationId: input.organizationId,
        },
      });

      if (!request) {
        throw new Error('Removal request not found.');
      }

      if (request.status !== 'requested') {
        throw new Error('Removal request has already been decided.');
      }

      request.status = input.decision === 'approve' ? 'approved' : 'rejected';
      request.reviewedBy = input.decidedBy;
      request.reviewedAt = new Date();
      request.reviewComment = input.comment?.trim() || null;
      await this.removalRequests.save(request);

      if (input.decision === 'approve') {
        await this.deliverables.delete({
          organizationId: OrganizationId.create(input.organizationId),
          deliverableId: new UniqueEntityId(request.deliverableId),
        });
      }

      await this.audit.record({
        organizationId: input.organizationId,
        actorName: input.decidedBy,
        action:
          input.decision === 'approve'
            ? 'deliverable.removal.approved'
            : 'deliverable.removal.rejected',
        entityType: 'deliverable',
        entityId: request.deliverableId,
        description:
          input.decision === 'approve'
            ? 'Remocao de entregavel aprovada e aplicada'
            : 'Remocao de entregavel rejeitada',
        metadata: {
          projectId: request.projectId,
          deliverableTitle: request.deliverableTitle,
          reason: request.reason,
          requestId: request.id,
          reviewComment: request.reviewComment,
        },
      });

      return Result.ok(mapRemovalRequest(request));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
