import { Request } from 'express';
import { AuthenticatedUser } from '../../../modules/identity/infrastructure/jwt/jwt.strategy';

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
