import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import type {
  Organization as OrganizationContract,
  User,
} from '../../../../shared/contracts/dashboard.contracts';
import { Organization } from '../entities/organization';
import { OrganizationMember } from '../entities/organization-member';

export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');

export interface OrganizationRepository {
  findById(organizationId: OrganizationId): Promise<Organization | null>;
  getById(organizationId: OrganizationId): Promise<OrganizationContract | null>;
  listMembers(organizationId: OrganizationId): Promise<OrganizationMember[]>;
  listUsers(organizationId: OrganizationId): Promise<User[]>;
}
