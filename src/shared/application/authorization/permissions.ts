export const permissions = {
  organization: {
    read: 'organization.read',
    updateProfile: 'organization.profile.update',
    updateLogo: 'organization.logo.update',
    membersRead: 'organization.members.read',
    membersManage: 'organization.members.manage',
    membersSecurityManage: 'organization.members.security.manage',
    membersClone: 'organization.members.clone',
  },
  priority: {
    request: 'priority.request',
    apply: 'priority.apply',
  },
  platform: {
    tenantsRead: 'platform.tenants.read',
    tenantSwitch: 'platform.tenant.switch',
    impersonate: 'platform.impersonate',
  },
} as const;

type LeafValues<T> = T extends string
  ? T
  : {
      [K in keyof T]: LeafValues<T[K]>;
    }[keyof T];

export type Permission = LeafValues<typeof permissions>;
