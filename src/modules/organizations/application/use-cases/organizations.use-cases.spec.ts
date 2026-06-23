import { randomUUID } from 'crypto';
import { AuthorizationService } from '../../../../shared/application/authorization/authorization.service';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { User } from '../../../identity/domain/entities/user';
import type { UserRepository } from '../../../identity/domain/repositories/user.repository';
import type { OrganizationRepository } from '../../domain/repositories/organization.repository';
import { CreateOrganizationMemberUseCase } from './create-organization-member.use-case';
import { GetCurrentOrganizationUseCase } from './get-current-organization.use-case';
import { ListOrganizationUsersUseCase } from './list-organization-users.use-case';
import { CloneOrganizationMemberUseCase } from './clone-organization-member.use-case';

describe('Organizations use cases', () => {
  it('loads the current organization scoped by authenticated tenant', async () => {
    const organizationId = randomUUID();
    const repository: Pick<OrganizationRepository, 'getById'> = {
      getById: jest.fn().mockResolvedValue({
        id: organizationId,
        name: 'Engenharia Horizonte Ltda',
        slug: 'engenharia-horizonte-ltda',
        parentId: null,
      }),
    };
    const useCase = new GetCurrentOrganizationUseCase(
      repository as OrganizationRepository,
    );

    await expect(useCase.execute({ organizationId })).resolves.toMatchObject({
      id: organizationId,
    });
    expect(repository.getById).toHaveBeenCalledWith(
      OrganizationId.create(organizationId),
    );
  });

  it('lists only users from the authenticated organization', async () => {
    const organizationId = randomUUID();
    const repository: Pick<OrganizationRepository, 'listUsers'> = {
      listUsers: jest.fn().mockResolvedValue([
        {
          id: randomUUID(),
          fullName: 'Lucas Eduardo',
          email: 'admin@engflow.local',
          roles: ['owner'],
          organizationId,
        },
      ]),
    };
    const useCase = new ListOrganizationUsersUseCase(
      repository as OrganizationRepository,
    );

    const users = await useCase.execute({ organizationId });

    expect(users[0]).toMatchObject({ roles: ['owner'], organizationId });
    expect(repository.listUsers).toHaveBeenCalledWith(
      OrganizationId.create(organizationId),
    );
  });

  it('creates a member when actor can manage the requested role', async () => {
    const organizationId = randomUUID();
    const savedUsers: User[] = [];
    const userRepository: Pick<UserRepository, 'findByEmail' | 'save'> = {
      findByEmail: jest.fn().mockResolvedValue(null),
      save: jest.fn(async (user: User) => {
        savedUsers.push(user);
      }),
    };
    const organizationRepository: Pick<OrganizationRepository, 'addMember'> = {
      addMember: jest.fn(),
    };
    const useCase = new CreateOrganizationMemberUseCase(
      userRepository as UserRepository,
      organizationRepository as OrganizationRepository,
      new AuthorizationService(),
    );

    const result = await useCase.execute({
      organizationId,
      actorRoles: ['admin'],
      fullName: 'Maria Silva',
      email: 'maria@example.com',
      password: 'Senha123',
      role: 'member',
    });

    expect(result.isOk()).toBe(true);
    expect(savedUsers[0].email.toString()).toBe('maria@example.com');
    expect(organizationRepository.addMember).toHaveBeenCalledWith({
      organizationId: OrganizationId.create(organizationId),
      userId: savedUsers[0].id,
      role: 'member',
    });
  });

  it('blocks creating a member above actor hierarchy', async () => {
    const useCase = new CreateOrganizationMemberUseCase(
      { findByEmail: jest.fn(), save: jest.fn() } as never,
      { addMember: jest.fn() } as never,
      new AuthorizationService(),
    );

    const result = await useCase.execute({
      organizationId: randomUUID(),
      actorRoles: ['manager'],
      fullName: 'Admin Futuro',
      email: 'admin@example.com',
      password: 'Senha123',
      role: 'admin',
    });

    expect(result.isFail()).toBe(true);
    expect(result.unwrapError().message).toBe('Insufficient role hierarchy.');
  });

  it('clones a member with a new email and source role', async () => {
    const organizationId = OrganizationId.create(randomUUID());
    const sourceUser = User.create({
      organizationId,
      name: 'Lucas Original',
      email: 'lucas@example.com',
      password: 'Senha123',
      avatarUrl: 's3://avatar',
    });
    const createMember = {
      execute: jest.fn().mockResolvedValue({ isOk: () => true }),
    };
    const useCase = new CloneOrganizationMemberUseCase(
      { findByIdGlobal: jest.fn().mockResolvedValue(sourceUser) } as never,
      { getMemberRole: jest.fn().mockResolvedValue('estimator') } as never,
      createMember as never,
    );

    await useCase.execute({
      organizationId: organizationId.toString(),
      actorRoles: ['admin'],
      sourceUserId: sourceUser.id,
      fullName: 'Lucas Clone',
      email: 'lucas.clone@example.com',
      password: 'Senha123',
    });

    expect(createMember.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'estimator',
        email: 'lucas.clone@example.com',
        avatarUrl: 's3://avatar',
      }),
    );
  });
});
