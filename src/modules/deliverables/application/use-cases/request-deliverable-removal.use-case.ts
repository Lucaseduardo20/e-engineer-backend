import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
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

export interface DeliverableRemovalRequestResponse {
  id: string;
  organizationId: string;
  projectId: string;
  deliverableId: string;
  deliverableTitle: string;
  requestedBy: string;
  reason: string;
  status: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewComment?: string | null;
  createdAt: string;
}

function hasRemovalApprovalAuthority(roles: string[], isPlatformAdmin?: boolean) {
  return (
    isPlatformAdmin === true ||
    roles.some((role) => ['owner', 'admin', 'manager'].includes(role))
  );
}

@Injectable()
export class RequestDeliverableRemovalUseCase {
  constructor(
    @Inject(DELIVERABLE_REPOSITORY)
    private readonly deliverables: DeliverableRepository,
    @InjectRepository(DeliverableRemovalRequestOrmEntity)
    private readonly removalRequests: Repository<DeliverableRemovalRequestOrmEntity>,
    private readonly audit: AuditQueryService,
  ) {}

  async execute(input: {
    organizationId: string;
    deliverableId: string;
    requestedBy: string;
    actorRoles: string[];
    actorIsPlatformAdmin?: boolean;
    reason: string;
  }): Promise<Result<DeliverableRemovalRequestResponse, Error>> {
    try {
      const reason = input.reason.trim();
      if (reason.length < 12) {
        throw new Error('Removal reason must explain the technical decision.');
      }

      const organizationId = OrganizationId.create(input.organizationId);
      const deliverable = await this.deliverables.getById(
        new UniqueEntityId(input.deliverableId),
        organizationId,
      );

      if (!deliverable) {
        throw new Error('Deliverable not found.');
      }

      const existing = await this.removalRequests.findOne({
        where: {
          organizationId: input.organizationId,
          deliverableId: input.deliverableId,
          status: 'requested',
        },
      });

      if (existing) {
        throw new Error('There is already a pending removal request for this deliverable.');
      }

      const canApplyNow = hasRemovalApprovalAuthority(
        input.actorRoles,
        input.actorIsPlatformAdmin,
      );
      const now = new Date();
      const request = this.removalRequests.create({
        id: randomUUID(),
        organizationId: input.organizationId,
        projectId: deliverable.projectId,
        deliverableId: deliverable.id,
        deliverableTitle: deliverable.title,
        requestedBy: input.requestedBy,
        reason,
        status: canApplyNow ? 'approved' : 'requested',
        reviewedBy: canApplyNow ? input.requestedBy : null,
        reviewedAt: canApplyNow ? now : null,
        reviewComment: canApplyNow ? 'Remocao aplicada por usuario com alcada.' : null,
      });

      await this.removalRequests.save(request);

      if (canApplyNow) {
        await this.deliverables.delete({
          organizationId,
          deliverableId: new UniqueEntityId(input.deliverableId),
        });
      }

      await this.audit.record({
        organizationId: input.organizationId,
        actorName: input.requestedBy,
        action: canApplyNow
          ? 'deliverable.removal.approved'
          : 'deliverable.removal.requested',
        entityType: 'deliverable',
        entityId: deliverable.id,
        description: canApplyNow
          ? 'Remocao de entregavel aprovada e aplicada'
          : 'Remocao de entregavel solicitada',
        metadata: {
          projectId: deliverable.projectId,
          deliverableTitle: deliverable.title,
          reason,
          requestId: request.id,
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

export function mapRemovalRequest(
  request: DeliverableRemovalRequestOrmEntity,
): DeliverableRemovalRequestResponse {
  return {
    id: request.id,
    organizationId: request.organizationId,
    projectId: request.projectId,
    deliverableId: request.deliverableId,
    deliverableTitle: request.deliverableTitle,
    requestedBy: request.requestedBy,
    reason: request.reason,
    status: request.status,
    reviewedBy: request.reviewedBy,
    reviewedAt: request.reviewedAt?.toISOString() ?? null,
    reviewComment: request.reviewComment,
    createdAt: request.createdAt.toISOString(),
  };
}
