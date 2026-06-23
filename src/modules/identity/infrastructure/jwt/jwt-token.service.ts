import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  GenerateTokenInput,
  TokenService,
} from '../../application/ports/token-service';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(input: GenerateTokenInput): string {
    const payload: JwtPayload = {
      sub: input.userId,
      organizationId: input.organizationId,
      roles: input.roles ?? [],
      isPlatformAdmin: input.isPlatformAdmin ?? false,
      actorUserId: input.actorUserId ?? null,
      actorOrganizationId: input.actorOrganizationId ?? null,
      impersonatedUserId: input.impersonatedUserId ?? null,
    };

    return this.jwtService.sign(payload);
  }

  refreshToken(token: string): string {
    const payload = this.jwtService.verify<JwtPayload>(token, {
      ignoreExpiration: true,
    });

    return this.generateToken({
      userId: payload.sub,
      organizationId: payload.organizationId,
      roles: payload.roles ?? [],
      isPlatformAdmin: payload.isPlatformAdmin ?? false,
      actorUserId: payload.actorUserId ?? null,
      actorOrganizationId: payload.actorOrganizationId ?? null,
      impersonatedUserId: payload.impersonatedUserId ?? null,
    });
  }

  validateToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);
  }
}
