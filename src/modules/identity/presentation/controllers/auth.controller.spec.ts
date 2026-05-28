import { UnauthorizedException } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { ImpersonateUserUseCase } from '../../application/use-cases/impersonate-user.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { SwitchTenantUseCase } from '../../application/use-cases/switch-tenant.use-case';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const refreshTokenUseCase = {
    execute: jest
      .fn()
      .mockResolvedValue(Result.ok({ token: 'refreshed-token' })),
  } as unknown as jest.Mocked<RefreshTokenUseCase>;
  const switchTenantUseCase = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<SwitchTenantUseCase>;
  const impersonateUserUseCase = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<ImpersonateUserUseCase>;

  it('returns login output when credentials are valid', async () => {
    const loginUseCase = {
      execute: jest.fn().mockResolvedValue(
        Result.ok({
          token: 'signed-token',
          user: {
            id: 'user-id',
            email: 'admin@company.com',
            name: 'Admin User',
            organizationId: 'organization-id',
          },
        }),
      ),
    } as unknown as jest.Mocked<LoginUseCase>;
    const controller = new AuthController(
      loginUseCase,
      refreshTokenUseCase,
      switchTenantUseCase,
      impersonateUserUseCase,
    );

    await expect(
      controller.login({
        email: 'admin@company.com',
        password: 'SecurePass123',
      }),
    ).resolves.toEqual({
      data: {
        token: 'signed-token',
        user: {
          id: 'user-id',
          email: 'admin@company.com',
          name: 'Admin User',
          organizationId: 'organization-id',
        },
      },
    });
  });

  it('maps failed login to unauthorized', async () => {
    const loginUseCase = {
      execute: jest
        .fn()
        .mockResolvedValue(
          Result.fail(new Error('Invalid email or password.')),
        ),
    } as unknown as jest.Mocked<LoginUseCase>;
    const controller = new AuthController(
      loginUseCase,
      refreshTokenUseCase,
      switchTenantUseCase,
      impersonateUserUseCase,
    );

    await expect(
      controller.login({
        email: 'admin@company.com',
        password: 'WrongPass123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns refreshed token when the token is valid', async () => {
    const loginUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<LoginUseCase>;
    const controller = new AuthController(
      loginUseCase,
      refreshTokenUseCase,
      switchTenantUseCase,
      impersonateUserUseCase,
    );

    await expect(
      controller.refresh({ token: 'signed-token' }),
    ).resolves.toEqual({
      data: {
        token: 'refreshed-token',
      },
    });
  });
});
