import { randomUUID } from 'crypto';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import type { OrganizationRepository } from '../../domain/repositories/organization.repository';
import { GetCurrentOrganizationUseCase } from './get-current-organization.use-case';
import { ListOrganizationUsersUseCase } from './list-organization-users.use-case';

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
});
