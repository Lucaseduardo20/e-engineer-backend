import type { AuthenticatedRequest } from '../infrastructure/auth/authenticated-request';

export function currentUser(request: AuthenticatedRequest) {
  return request.user;
}
