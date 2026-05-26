import { UnauthorizedException } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
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
    const controller = new AuthController(loginUseCase);

    await expect(
      controller.login({
        email: 'admin@company.com',
        password: 'SecurePass123',
      }),
    ).resolves.toEqual({
      token: 'signed-token',
      user: {
        id: 'user-id',
        email: 'admin@company.com',
        name: 'Admin User',
        organizationId: 'organization-id',
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
    const controller = new AuthController(loginUseCase);

    await expect(
      controller.login({
        email: 'admin@company.com',
        password: 'WrongPass123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
