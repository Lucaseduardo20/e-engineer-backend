import { Entity } from '../../../../shared/domain/entities/entity';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';

export const priorityTargetTypes = [
  'project',
  'deliverable',
  'review',
  'document',
] as const;
export type PriorityTargetType = (typeof priorityTargetTypes)[number];

export const priorityLevels = ['normal', 'high', 'urgent'] as const;
export type PriorityLevel = (typeof priorityLevels)[number];

export const priorityRequestStatuses = [
  'requested',
  'applied',
  'rejected',
] as const;
export type PriorityRequestStatus = (typeof priorityRequestStatuses)[number];

export interface PriorityRequestProps {
  organizationId: OrganizationId;
  targetType: PriorityTargetType;
  targetId: string;
  requestedBy: string;
  requestedForUserId?: string | null;
  priority: PriorityLevel;
  reason?: string | null;
  status: PriorityRequestStatus;
  decidedBy?: string | null;
  decidedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PriorityRequest extends Entity<PriorityRequestProps> {
  private constructor(props: PriorityRequestProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(params: {
    organizationId: OrganizationId;
    targetType: string;
    targetId: string;
    requestedBy: string;
    requestedForUserId?: string | null;
    priority: string;
    reason?: string | null;
    autoApply?: boolean;
  }): PriorityRequest {
    const now = new Date();

    return new PriorityRequest({
      organizationId: params.organizationId,
      targetType: normalizeTargetType(params.targetType),
      targetId: normalizeRequired(params.targetId, 'Target id'),
      requestedBy: normalizeRequired(params.requestedBy, 'Requester'),
      requestedForUserId: normalizeOptionalUuidLike(params.requestedForUserId),
      priority: normalizePriority(params.priority),
      reason: normalizeReason(params.reason),
      status: params.autoApply ? 'applied' : 'requested',
      decidedBy: params.autoApply ? params.requestedBy : null,
      decidedAt: params.autoApply ? now : null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(
    props: PriorityRequestProps,
    id: UniqueEntityId,
  ): PriorityRequest {
    return new PriorityRequest(props, id);
  }

  apply(decidedBy: string): void {
    this.props.status = 'applied';
    this.props.decidedBy = normalizeRequired(decidedBy, 'Decision actor');
    this.props.decidedAt = new Date();
    this.props.updatedAt = new Date();
  }

  reject(decidedBy: string): void {
    this.props.status = 'rejected';
    this.props.decidedBy = normalizeRequired(decidedBy, 'Decision actor');
    this.props.decidedAt = new Date();
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.getId().toString();
  }

  get propsValue(): PriorityRequestProps {
    return this.props;
  }
}

function normalizeOptionalUuidLike(value?: string | null): string | null {
  const normalized = value?.trim() ?? '';

  return normalized || null;
}

function normalizeTargetType(value: string): PriorityTargetType {
  if (priorityTargetTypes.includes(value as PriorityTargetType)) {
    return value as PriorityTargetType;
  }

  throw new Error('Invalid priority target type.');
}

function normalizePriority(value: string): PriorityLevel {
  if (priorityLevels.includes(value as PriorityLevel)) {
    return value as PriorityLevel;
  }

  throw new Error('Invalid priority level.');
}

function normalizeRequired(value: string, label: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function normalizeReason(value?: string | null): string | null {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    return null;
  }

  if (normalized.length > 1000) {
    throw new Error('Reason must have at most 1000 characters.');
  }

  return normalized;
}
