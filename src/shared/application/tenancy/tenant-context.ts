import { OrganizationId } from '../../domain/value-objects/organization-id';

export interface TenantContext {
  readonly organizationId: OrganizationId;
}
