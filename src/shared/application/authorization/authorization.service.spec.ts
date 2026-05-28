import { permissions } from './permissions';
import { AuthorizationService } from './authorization.service';

describe('AuthorizationService', () => {
  const service = new AuthorizationService();

  it('grants tenant permissions from centralized role mapping', () => {
    expect(
      service.hasPermission(
        { roles: ['admin'] },
        permissions.organization.membersSecurityManage,
      ),
    ).toBe(true);
    expect(
      service.hasPermission(
        { roles: ['project_manager'] },
        permissions.organization.membersSecurityManage,
      ),
    ).toBe(false);
  });

  it('supports all named permissions for platform admins', () => {
    expect(
      service.hasPermission(
        { roles: ['member'], isPlatformAdmin: true },
        permissions.platform.impersonate,
      ),
    ).toBe(true);
    expect(
      service.hasPermission(
        { roles: [], isPlatformAdmin: true },
        permissions.organization.membersManage,
      ),
    ).toBe(true);
    expect(
      service.hasPermission(
        { roles: ['owner'] },
        permissions.platform.impersonate,
      ),
    ).toBe(false);
  });

  it('prevents lower hierarchy roles from managing higher roles', () => {
    expect(service.canManageRole({ roles: ['admin'] }, 'manager')).toBe(true);
    expect(service.canManageRole({ roles: ['manager'] }, 'admin')).toBe(false);
  });
});
