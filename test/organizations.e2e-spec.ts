import {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../src/shared/infrastructure/auth/jwt-auth.guard';
import { PermissionsGuard } from '../src/shared/infrastructure/auth/permissions.guard';
import { OrganizationsController } from '../src/modules/organizations/presentation/controllers/organizations.controller';
import { GetCurrentOrganizationUseCase } from '../src/modules/organizations/application/use-cases/get-current-organization.use-case';
import { ListOrganizationUsersUseCase } from '../src/modules/organizations/application/use-cases/list-organization-users.use-case';
import { ListPlatformOrganizationsUseCase } from '../src/modules/organizations/application/use-cases/list-platform-organizations.use-case';
import { UpdateOrganizationProfileUseCase } from '../src/modules/organizations/application/use-cases/update-organization-profile.use-case';
import { CreateOrganizationMemberUseCase } from '../src/modules/organizations/application/use-cases/create-organization-member.use-case';
import { UpdateOrganizationMemberUseCase } from '../src/modules/organizations/application/use-cases/update-organization-member.use-case';
import { CloneOrganizationMemberUseCase } from '../src/modules/organizations/application/use-cases/clone-organization-member.use-case';
import { OrganizationAssetStorageService } from '../src/modules/organizations/infrastructure/storage/organization-asset-storage.service';

const organizationId = randomUUID();
const userId = randomUUID();

class TestJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const httpRequest = context.switchToHttp().getRequest<{
      user?: {
        userId: string;
        organizationId: string;
        roles: string[];
        isPlatformAdmin: boolean;
      };
    }>();
    httpRequest.user = {
      userId,
      organizationId,
      roles: ['owner'],
      isPlatformAdmin: false,
    };

    return true;
  }
}

class TestPermissionsGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

describe('OrganizationsController (e2e)', () => {
  let app: INestApplication<App>;
  const getCurrentOrganizationUseCase = {
    execute: jest.fn(),
  };
  const listOrganizationUsersUseCase = {
    execute: jest.fn(),
  };
  const createOrganizationMemberUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        {
          provide: GetCurrentOrganizationUseCase,
          useValue: getCurrentOrganizationUseCase,
        },
        {
          provide: ListOrganizationUsersUseCase,
          useValue: listOrganizationUsersUseCase,
        },
        {
          provide: ListPlatformOrganizationsUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateOrganizationProfileUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CreateOrganizationMemberUseCase,
          useValue: createOrganizationMemberUseCase,
        },
        {
          provide: UpdateOrganizationMemberUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CloneOrganizationMemberUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: OrganizationAssetStorageService,
          useValue: { upload: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtGuard)
      .overrideGuard(PermissionsGuard)
      .useClass(TestPermissionsGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns the authenticated organization in the API envelope', async () => {
    getCurrentOrganizationUseCase.execute.mockResolvedValue({
      id: organizationId,
      name: 'Engenharia Horizonte Ltda',
      slug: 'engenharia-horizonte-ltda',
      parentId: null,
    });

    await request(app.getHttpServer())
      .get('/organizations/current')
      .expect(200)
      .expect({
        data: {
          id: organizationId,
          name: 'Engenharia Horizonte Ltda',
          slug: 'engenharia-horizonte-ltda',
          parentId: null,
        },
      });

    expect(getCurrentOrganizationUseCase.execute).toHaveBeenCalledWith({
      organizationId,
    });
  });

  it('returns only users requested through the authenticated organization', async () => {
    listOrganizationUsersUseCase.execute.mockResolvedValue([
      {
        id: userId,
        fullName: 'Lucas Eduardo',
        email: 'admin@engflow.local',
        roles: ['owner'],
        organizationId,
      },
    ]);

    const response = await request(app.getHttpServer())
      .get('/organizations/current/users')
      .expect(200);
    const body = response.body as {
      data: Array<{ id: string; roles: string[]; organizationId: string }>;
    };

    expect(body.data).toEqual([
      expect.objectContaining({ id: userId, roles: ['owner'], organizationId }),
    ]);
    expect(listOrganizationUsersUseCase.execute).toHaveBeenCalledWith({
      organizationId,
    });
  });

  it('creates collaborators through the authenticated organization', async () => {
    createOrganizationMemberUseCase.execute.mockResolvedValue({
      isFail: () => false,
      unwrap: () => ({
        id: randomUUID(),
        fullName: 'Marina Costa',
        email: 'marina@engflow.local',
        roles: ['member'],
        organizationId,
      }),
    });

    await request(app.getHttpServer())
      .post('/organizations/current/users')
      .send({
        fullName: 'Marina Costa',
        email: 'marina@engflow.local',
        password: 'Senha123',
        role: 'member',
      })
      .expect(201);

    expect(createOrganizationMemberUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId,
        fullName: 'Marina Costa',
        role: 'member',
      }),
    );
  });
});
