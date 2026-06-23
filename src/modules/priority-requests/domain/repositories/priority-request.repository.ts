import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { PriorityRequest } from '../entities/priority-request';

export const PRIORITY_REQUEST_REPOSITORY = Symbol(
  'PRIORITY_REQUEST_REPOSITORY',
);

export interface PriorityRequestRepository {
  save(priorityRequest: PriorityRequest): Promise<void>;
  findById(
    id: string,
    organizationId: OrganizationId,
  ): Promise<PriorityRequest | null>;
  list(organizationId: OrganizationId): Promise<PriorityRequest[]>;
}
