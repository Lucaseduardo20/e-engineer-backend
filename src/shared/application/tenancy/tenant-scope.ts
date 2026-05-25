import { OrganizationId } from '../../domain/value-objects/organization-id';

export interface TenantScope {
  readonly organizationId: OrganizationId;
}
