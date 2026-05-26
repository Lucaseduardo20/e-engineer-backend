import { TenantScope } from '../../../../shared/application/tenancy/tenant-scope';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { User } from '../entities/user';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  save(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string, scope: TenantScope): Promise<User | null>;
  findByOrganizationId(
    organizationId: OrganizationId,
    scope: TenantScope,
  ): Promise<User[]>;
}
