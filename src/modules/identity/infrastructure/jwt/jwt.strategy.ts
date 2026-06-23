import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      organizationId: payload.organizationId,
      roles: payload.roles ?? [],
      isPlatformAdmin: payload.isPlatformAdmin ?? false,
      actorUserId: payload.actorUserId ?? null,
      actorOrganizationId: payload.actorOrganizationId ?? null,
      impersonatedUserId: payload.impersonatedUserId ?? null,
    };
  }
}

export interface AuthenticatedUser {
  userId: string;
  organizationId: string;
  roles: string[];
  isPlatformAdmin: boolean;
  actorUserId?: string | null;
  actorOrganizationId?: string | null;
  impersonatedUserId?: string | null;
}
