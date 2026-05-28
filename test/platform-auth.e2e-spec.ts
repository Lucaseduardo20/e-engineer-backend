import {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AuthorizationService } from '../src/shared/application/authorization/authorization.service';
import { JwtAuthGuard } from '../src/shared/infrastructure/auth/jwt-auth.guard';
import { PermissionsGuard } from '../src/shared/infrastructure/auth/permissions.guard';
import { LoginUseCase } from '../src/modules/identity/application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../src/modules/identity/application/use-cases/refresh-token.use-case';
import { SwitchTenantUseCase } from '../src/modules/identity/application/use-cases/switch-tenant.use-case';
import { ImpersonateUserUseCase } from '../src/modules/identity/application/use-cases/impersonate-user.use-case';
import { AuthController } from '../src/modules/identity/presentation/controllers/auth.controller';
import { Result } from '../src/shared/application/result/result';

const actorUserId = randomUUID();
const organizationId = randomUUID();
const nextOrganizationId = randomUUID();

class PlatformJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: {
        userId: string;
        organizationId: string;
        roles: string[];
        isPlatformAdmin: boolean;
      };
    }>();
    request.user = {
      userId: actorUserId,
      organizationId,
      roles: ['owner'],
      isPlatformAdmin: true,
    };

    return true;
  }
}

describe('Platform auth endpoints (e2e)', () => {
  let app: INestApplication<App>;
  const switchTenantUseCase = {
    execute: jest.fn(),
  };
  const impersonateUserUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    switchTenantUseCase.execute.mockResolvedValue(
      Result.ok({
        token: 'tenant-token',
        user: {
          id: actorUserId,
          fullName: 'Lucas Eduardo',
          email: 'admin@engflow.local',
          roles: ['owner'],
          isPlatformAdmin: true,
          organizationId: nextOrganizationId,
        },
      }),
    );
    impersonateUserUseCase.execute.mockResolvedValue(
      Result.ok({
        token: 'impersonated-token',
        user: {
          id: 'target-user',
          fullName: 'Rafael',
          email: 'rafael@engflow.local',
          roles: ['member'],
          isPlatformAdmin: false,
          impersonatedBy: actorUserId,
          organizationId,
        },
      }),
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        Reflector,
        AuthorizationService,
        PermissionsGuard,
        { provide: LoginUseCase, useValue: { execute: jest.fn() } },
        { provide: RefreshTokenUseCase, useValue: { execute: jest.fn() } },
        { provide: SwitchTenantUseCase, useValue: switchTenantUseCase },
        { provide: ImpersonateUserUseCase, useValue: impersonateUserUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(PlatformJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('switches tenant for platform admins through the permission guard', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/switch-tenant')
      .send({ organizationId: nextOrganizationId })
      .expect(201);
    expect(response.text).toContain('tenant-token');
    expect(switchTenantUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId,
        actorIsPlatformAdmin: true,
        organizationId: nextOrganizationId,
      }),
    );
  });

  it('impersonates tenant members for platform admins through the permission guard', async () => {
    const targetUserId = randomUUID();
    const response = await request(app.getHttpServer())
      .post('/auth/impersonate')
      .send({ userId: targetUserId, organizationId })
      .expect(201);
    expect(response.text).toContain('impersonated-token');
    expect(impersonateUserUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId,
        userId: targetUserId,
        organizationId,
      }),
    );
  });
});
