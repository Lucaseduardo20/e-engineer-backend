export interface JwtPayload {
  sub: string;
  organizationId: string;
  roles?: string[];
  isPlatformAdmin?: boolean;
  actorUserId?: string | null;
  actorOrganizationId?: string | null;
  impersonatedUserId?: string | null;
  iat?: number;
  exp?: number;
}
