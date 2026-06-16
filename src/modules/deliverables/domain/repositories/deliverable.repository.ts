import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type {
  Deliverable as DeliverableContract,
  Paginated,
} from '../../../../shared/contracts/dashboard.contracts';
import { Deliverable } from '../entities/deliverable';

export const DELIVERABLE_REPOSITORY = Symbol('DELIVERABLE_REPOSITORY');

export interface ListDeliverablesParams {
  projectId?: UniqueEntityId;
  page: number;
  pageSize: number;
  status?: DeliverableContract['status'];
}

export interface DeliverableRepository {
  save(deliverable: Deliverable): Promise<void>;
  syncTags(params: {
    deliverableId: UniqueEntityId;
    organizationId: OrganizationId;
    tagIds: string[];
    actorId: string;
  }): Promise<void>;
  list(
    organizationId: OrganizationId,
    params: ListDeliverablesParams,
  ): Promise<Paginated<DeliverableContract>>;
  getById(
    deliverableId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<DeliverableContract | null>;
  findById(
    deliverableId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<Deliverable | null>;
  markInheritanceReviewed(params: {
    deliverableId: UniqueEntityId;
    organizationId: OrganizationId;
    reviewedBy: string;
  }): Promise<DeliverableContract | null>;
  delete(params: {
    deliverableId: UniqueEntityId;
    organizationId: OrganizationId;
  }): Promise<boolean>;
  projectExists(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<boolean>;
}
