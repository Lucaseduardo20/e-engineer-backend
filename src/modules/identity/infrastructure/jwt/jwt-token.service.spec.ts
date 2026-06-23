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
        roles: ['owner'],
        isPlatformAdmin: true,
      }),
    } as unknown as jest.Mocked<JwtService>;
    tokenService = new JwtTokenService(jwtService);
  });

  it('signs user and organization context', () => {
    expect(
      tokenService.generateToken({
        userId: 'user-1',
        organizationId: 'org-1',
        roles: ['owner'],
        isPlatformAdmin: true,
      }),
    ).toBe('signed-token');
    expect(jwtService.sign.mock.calls[0][0]).toEqual({
      sub: 'user-1',
      organizationId: 'org-1',
      roles: ['owner'],
      isPlatformAdmin: true,
      actorUserId: null,
      actorOrganizationId: null,
      impersonatedUserId: null,
    });
  });

  it('refreshes tokens while ignoring expiration', () => {
    expect(tokenService.refreshToken('expired-token')).toBe('signed-token');
    expect(jwtService.verify.mock.calls[0]).toEqual([
      'expired-token',
      {
        ignoreExpiration: true,
      },
    ]);
    expect(jwtService.sign.mock.calls[0][0]).toEqual({
      sub: 'user-1',
      organizationId: 'org-1',
      roles: ['owner'],
      isPlatformAdmin: true,
      actorUserId: null,
      actorOrganizationId: null,
      impersonatedUserId: null,
    });
  });

  it('validates tokens with default JWT verification', () => {
    expect(tokenService.validateToken('signed-token')).toEqual({
      sub: 'user-1',
      organizationId: 'org-1',
      roles: ['owner'],
      isPlatformAdmin: true,
    });
    expect(jwtService.verify.mock.calls[0]).toEqual(['signed-token']);
  });
});
