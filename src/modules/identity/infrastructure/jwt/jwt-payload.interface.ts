export interface JwtPayload {
  sub: string;
  organizationId: string;
  iat?: number;
  exp?: number;
}
