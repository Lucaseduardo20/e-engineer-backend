import { Injectable } from '@nestjs/common';
import { Permission, permissions } from './permissions';
import { permissionsForRoles, roleCanManageRole } from './role-permissions';

export interface AuthorizationSubject {
  roles: string[];
  isPlatformAdmin?: boolean;
}

@Injectable()
export class AuthorizationService {
  hasPermission(
    subject: AuthorizationSubject,
    permission: Permission,
  ): boolean {
    if (subject.isPlatformAdmin) {
      return true;
    }

    return permissionsForRoles(subject.roles).includes(permission);
  }

  hasAllPermissions(
    subject: AuthorizationSubject,
    requiredPermissions: Permission[],
  ): boolean {
    return requiredPermissions.every((permission) =>
      this.hasPermission(subject, permission),
    );
  }

  canManageRole(subject: AuthorizationSubject, targetRole: string): boolean {
    if (subject.isPlatformAdmin) {
      return true;
    }

    return subject.roles.some((role) => roleCanManageRole(role, targetRole));
  }

  permissionsFor(subject: AuthorizationSubject): Permission[] {
    const tenantPermissions = permissionsForRoles(subject.roles);

    if (!subject.isPlatformAdmin) {
      return tenantPermissions;
    }

    return [...new Set([...tenantPermissions, ...flattenPermissions()])];
  }
}

function flattenPermissions(): Permission[] {
  return Object.values(permissions).flatMap((group) => Object.values(group));
}
