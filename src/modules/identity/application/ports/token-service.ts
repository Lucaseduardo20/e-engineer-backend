export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface TokenService {
  generateToken(userId: string, organizationId: string): string;
  refreshToken(token: string): string;
}
