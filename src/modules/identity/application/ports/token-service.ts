export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface GenerateTokenInput {
  userId: string;
  organizationId: string;
  roles?: string[];
  isPlatformAdmin?: boolean;
  actorUserId?: string | null;
  actorOrganizationId?: string | null;
  impersonatedUserId?: string | null;
}

export interface TokenService {
  generateToken(input: GenerateTokenInput): string;
  refreshToken(token: string): string;
}
