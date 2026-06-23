import { randomUUID } from 'crypto';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { User } from '../../domain/entities/user';
import { UserRepository } from '../../domain/repositories/user.repository';
import { TokenService } from '../ports/token-service';
import { ImpersonateUserUseCase } from './impersonate-user.use-case';
import { SwitchTenantUseCase } from './switch-tenant.use-case';

class InMemoryUserRepository implements UserRepository {
  readonly users: User[] = [];
  readonly roles = new Map<string, string[]>();

  save(user: User): Promise<void> {
    this.users.push(user);
    return Promise.resolve();
  }

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(
      this.users.find((user) => user.email.toString() === email) ?? null,
    );
  }

  findByIdGlobal(id: string): Promise<User | null> {
    return Promise.resolve(this.users.find((user) => user.id === id) ?? null);
  }

  findById(): Promise<User | null> {
    return Promise.resolve(null);
  }

  getMembershipRoles(
    userId: string,
    organizationId: OrganizationId,
  ): Promise<string[]> {
    return Promise.resolve(
      this.roles.get(`${userId}:${organizationId.toString()}`) ?? [],
    );
  }

  findByOrganizationId(): Promise<User[]> {
    return Promise.resolve([]);
  }
}

function createUser(params: {
  organizationId: string;
  email: string;
  name: string;
  isPlatformAdmin?: boolean;
}) {
  const user = User.create({
    organizationId: OrganizationId.create(params.organizationId),
    email: params.email,
    password: 'SecurePass123',
    name: params.name,
  });

  return User.restore(
    {
      organizationId: user.organizationId,
      email: user.email,
      password: user.password,
      name: user.name,
      avatarUrl: null,
      isPlatformAdmin: params.isPlatformAdmin ?? false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: null,
    },
    user.getId(),
  );
}

describe('Platform session use cases', () => {
  let repository: InMemoryUserRepository;
  let tokenService: jest.Mocked<TokenService>;
  const organizationId = randomUUID();
  const nextOrganizationId = randomUUID();

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    tokenService = {
      generateToken: jest.fn().mockReturnValue('platform-token'),
      refreshToken: jest.fn(),
    };
  });

  it('allows platform admins to switch tenant as themselves', async () => {
    const lucas = createUser({
      organizationId,
      email: 'admin@engflow.local',
      name: 'Lucas Eduardo',
      isPlatformAdmin: true,
    });
    repository.users.push(lucas);
    repository.roles.set(`${lucas.id}:${nextOrganizationId}`, ['owner']);
    const useCase = new SwitchTenantUseCase(repository, tokenService);

    const result = await useCase.execute({
      actorUserId: lucas.id,
      actorOrganizationId: organizationId,
      actorRoles: ['owner'],
      actorIsPlatformAdmin: true,
      organizationId: nextOrganizationId,
    });

    expect(result.isOk()).toBe(true);
    expect(tokenService.generateToken.mock.calls[0][0]).toMatchObject({
      userId: lucas.id,
      organizationId: nextOrganizationId,
      isPlatformAdmin: true,
    });
  });

  it('allows platform admins to impersonate tenant members without platform privileges', async () => {
    const lucas = createUser({
      organizationId,
      email: 'admin@engflow.local',
      name: 'Lucas Eduardo',
      isPlatformAdmin: true,
    });
    const target = createUser({
      organizationId,
      email: 'rafael@engflow.local',
      name: 'Rafael',
    });
    repository.users.push(lucas, target);
    repository.roles.set(`${target.id}:${organizationId}`, ['member']);
    const useCase = new ImpersonateUserUseCase(repository, tokenService);

    const result = await useCase.execute({
      actorUserId: lucas.id,
      actorOrganizationId: organizationId,
      actorRoles: ['owner'],
      actorIsPlatformAdmin: true,
      userId: target.id,
      organizationId,
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().user.impersonatedBy).toBe(lucas.id);
    expect(tokenService.generateToken.mock.calls[0][0]).toMatchObject({
      userId: target.id,
      isPlatformAdmin: false,
      actorUserId: lucas.id,
    });
  });
});
