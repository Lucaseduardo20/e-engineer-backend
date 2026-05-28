import { randomUUID } from 'crypto';
import { OrganizationId } from '../../../../../shared/domain/value-objects/organization-id';
import { TypeOrmOrganizationRepository } from './typeorm-organization.repository';

describe('TypeOrmOrganizationRepository', () => {
  it('lists organization users with membership roles using tenant scope', async () => {
    const organizationId = randomUUID();
    const manager = {
      query: jest.fn().mockResolvedValue([
        {
          membership_id: randomUUID(),
          user_id: randomUUID(),
          full_name: 'Lucas Eduardo',
          email: 'admin@engflow.local',
          role: 'owner',
        },
      ]),
    };
    const repository = new TypeOrmOrganizationRepository(
      { findOne: jest.fn() } as never,
      { manager } as never,
    );

    const users = await repository.listUsers(
      OrganizationId.create(organizationId),
    );

    expect(users[0]).toMatchObject({
      fullName: 'Lucas Eduardo',
      email: 'admin@engflow.local',
      roles: ['owner'],
      organizationId,
    });
    expect(manager.query).toHaveBeenCalledWith(expect.any(String), [
      organizationId,
    ]);
  });
});
