import type { PriorityRequest as PriorityRequestContract } from '../../../../shared/contracts/dashboard.contracts';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import {
  PriorityRequest,
  type PriorityLevel,
  type PriorityRequestStatus,
  type PriorityTargetType,
} from '../../domain/entities/priority-request';
import { PriorityRequestOrmEntity } from '../persistence/typeorm/priority-request.orm-entity';

export class PriorityRequestMapper {
  static toDomain(ormEntity: PriorityRequestOrmEntity): PriorityRequest {
    return PriorityRequest.restore(
      {
        organizationId: OrganizationId.create(ormEntity.organizationId),
        targetType: ormEntity.targetType as PriorityTargetType,
        targetId: ormEntity.targetId,
        requestedBy: ormEntity.requestedBy,
        requestedForUserId: ormEntity.requestedForUserId,
        priority: ormEntity.priority as PriorityLevel,
        reason: ormEntity.reason,
        status: ormEntity.status as PriorityRequestStatus,
        decidedBy: ormEntity.decidedBy,
        decidedAt: ormEntity.decidedAt,
        createdAt: ormEntity.createdAt,
        updatedAt: ormEntity.updatedAt,
      },
      new UniqueEntityId(ormEntity.id),
    );
  }

  static toOrm(priorityRequest: PriorityRequest): PriorityRequestOrmEntity {
    const ormEntity = new PriorityRequestOrmEntity();
    const props = priorityRequest.propsValue;

    ormEntity.id = priorityRequest.id;
    ormEntity.organizationId = props.organizationId.toString();
    ormEntity.targetType = props.targetType;
    ormEntity.targetId = props.targetId;
    ormEntity.requestedBy = props.requestedBy;
    ormEntity.requestedForUserId = props.requestedForUserId ?? null;
    ormEntity.priority = props.priority;
    ormEntity.reason = props.reason ?? null;
    ormEntity.status = props.status;
    ormEntity.decidedBy = props.decidedBy ?? null;
    ormEntity.decidedAt = props.decidedAt ?? null;
    ormEntity.createdAt = props.createdAt;
    ormEntity.updatedAt = props.updatedAt;

    return ormEntity;
  }

  static toContract(priorityRequest: PriorityRequest): PriorityRequestContract {
    const props = priorityRequest.propsValue;

    return {
      id: priorityRequest.id,
      organizationId: props.organizationId.toString(),
      targetType: props.targetType,
      targetId: props.targetId,
      requestedBy: props.requestedBy,
      requestedForUserId: props.requestedForUserId ?? null,
      priority: props.priority,
      reason: props.reason ?? null,
      status: props.status,
      decidedBy: props.decidedBy ?? null,
      decidedAt: props.decidedAt?.toISOString() ?? null,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }
}
