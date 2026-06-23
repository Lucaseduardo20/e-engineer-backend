import { SetMetadata } from '@nestjs/common';
import { Permission } from '../../application/authorization/permissions';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

export const RequirePermissions = (...requiredPermissions: Permission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, requiredPermissions);
