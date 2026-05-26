import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../../application/ports/token-service';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(userId: string, organizationId: string): string {
    const payload: JwtPayload = {
      sub: userId,
      organizationId,
    };

    return this.jwtService.sign(payload);
  }

  refreshToken(token: string): string {
    const payload = this.jwtService.verify<JwtPayload>(token, {
      ignoreExpiration: true,
    });

    return this.generateToken(payload.sub, payload.organizationId);
  }

  validateToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);
  }
}
