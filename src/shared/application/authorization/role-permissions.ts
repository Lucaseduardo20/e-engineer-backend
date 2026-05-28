import { Permission, permissions } from './permissions';

export const tenantRoles = [
  'owner',
  'admin',
  'manager',
  'project_manager',
  'estimator',
  'finance',
  'member',
] as const;

export type TenantRole = (typeof tenantRoles)[number];

const roleWeights: Record<TenantRole, number> = {
  owner: 700,
  admin: 600,
  manager: 500,
  project_manager: 420,
  estimator: 360,
  finance: 340,
  member: 100,
};

export const rolePermissions: Record<TenantRole, Permission[]> = {
  owner: [
    permissions.organization.read,
    permissions.organization.updateProfile,
    permissions.organization.updateLogo,
    permissions.organization.membersRead,
    permissions.organization.membersManage,
    permissions.organization.membersSecurityManage,
    permissions.organization.membersClone,
    permissions.priority.request,
    permissions.priority.apply,
  ],
  admin: [
    permissions.organization.read,
    permissions.organization.updateProfile,
    permissions.organization.updateLogo,
    permissions.organization.membersRead,
    permissions.organization.membersManage,
    permissions.organization.membersSecurityManage,
    permissions.organization.membersClone,
    permissions.priority.request,
    permissions.priority.apply,
  ],
  manager: [
    permissions.organization.read,
    permissions.organization.membersRead,
    permissions.priority.request,
    permissions.priority.apply,
  ],
  project_manager: [
    permissions.organization.read,
    permissions.organization.membersRead,
    permissions.priority.request,
  ],
  estimator: [
    permissions.organization.read,
    permissions.organization.membersRead,
    permissions.priority.request,
  ],
  finance: [
    permissions.organization.read,
    permissions.organization.membersRead,
    permissions.priority.request,
  ],
  member: [permissions.organization.read, permissions.priority.request],
};

export function normalizeTenantRole(value: string): TenantRole {
  return tenantRoles.includes(value as TenantRole)
    ? (value as TenantRole)
    : 'member';
}

export function roleCanManageRole(
  actorRole: string,
  targetRole: string,
): boolean {
  const actor = normalizeTenantRole(actorRole);
  const target = normalizeTenantRole(targetRole);

  if (actor === 'owner') {
    return true;
  }

  return roleWeights[actor] > roleWeights[target];
}

export function permissionsForRoles(roles: string[]): Permission[] {
  return [
    ...new Set(
      roles.flatMap((role) => rolePermissions[normalizeTenantRole(role)]),
    ),
  ];
}
