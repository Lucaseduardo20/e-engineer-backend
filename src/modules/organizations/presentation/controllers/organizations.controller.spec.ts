import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import { GetCurrentOrganizationUseCase } from '../../application/use-cases/get-current-organization.use-case';
import { ListOrganizationUsersUseCase } from '../../application/use-cases/list-organization-users.use-case';
import { OrganizationsController } from './organizations.controller';

describe('OrganizationsController', () => {
  const organizationId = randomUUID();
  const request = {
    user: {
      userId: randomUUID(),
      organizationId,
    },
  } as AuthenticatedRequest;

  it('returns the current organization from authenticated tenant', async () => {
    const getCurrent = {
      execute: jest.fn().mockResolvedValue({
        id: organizationId,
        name: 'Engenharia Horizonte Ltda',
        slug: 'engenharia-horizonte-ltda',
        parentId: null,
      }),
    };
    const listUsers = {
      execute: jest.fn(),
    };
    const controller = new OrganizationsController(
      getCurrent as unknown as GetCurrentOrganizationUseCase,
      listUsers as unknown as ListOrganizationUsersUseCase,
    );

    const response = await controller.current(request);

    expect(response.data.id).toBe(organizationId);
    expect(getCurrent.execute).toHaveBeenCalledWith({ organizationId });
  });

  it('returns users from authenticated tenant with membership roles', async () => {
    const getCurrent = {
      execute: jest.fn(),
    };
    const listUsers = {
      execute: jest.fn().mockResolvedValue([
        {
          id: randomUUID(),
          fullName: 'Lucas Eduardo',
          email: 'admin@engflow.local',
          roles: ['owner'],
          organizationId,
        },
      ]),
    };
    const controller = new OrganizationsController(
      getCurrent as unknown as GetCurrentOrganizationUseCase,
      listUsers as unknown as ListOrganizationUsersUseCase,
    );

    const response = await controller.users(request);

    expect(response.data[0]).toMatchObject({
      roles: ['owner'],
      organizationId,
    });
    expect(listUsers.execute).toHaveBeenCalledWith({ organizationId });
  });

  it('raises not found when authenticated organization is missing', async () => {
    const controller = new OrganizationsController(
      { execute: jest.fn().mockResolvedValue(null) } as never,
      { execute: jest.fn() } as never,
    );

    await expect(controller.current(request)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
