import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from './jwt-token.service';

describe('JwtTokenService', () => {
  let jwtService: jest.Mocked<JwtService>;
  let tokenService: JwtTokenService;

  beforeEach(() => {
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verify: jest.fn().mockReturnValue({
        sub: 'user-1',
        organizationId: 'org-1',
      }),
    } as unknown as jest.Mocked<JwtService>;
    tokenService = new JwtTokenService(jwtService);
  });

  it('signs user and organization context', () => {
    expect(tokenService.generateToken('user-1', 'org-1')).toBe('signed-token');
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'user-1',
      organizationId: 'org-1',
    });
  });

  it('refreshes tokens while ignoring expiration', () => {
    expect(tokenService.refreshToken('expired-token')).toBe('signed-token');
    expect(jwtService.verify).toHaveBeenCalledWith('expired-token', {
      ignoreExpiration: true,
    });
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'user-1',
      organizationId: 'org-1',
    });
  });

  it('validates tokens with default JWT verification', () => {
    expect(tokenService.validateToken('signed-token')).toEqual({
      sub: 'user-1',
      organizationId: 'org-1',
    });
    expect(jwtService.verify).toHaveBeenCalledWith('signed-token');
  });
});
