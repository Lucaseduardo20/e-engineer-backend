import { randomUUID } from 'crypto';
import { OrganizationMapper } from './organization.mapper';
import { OrganizationOrmEntity } from '../persistence/typeorm/organization.orm-entity';

describe('OrganizationMapper', () => {
  it('maps persistence entities into domain and API contracts', () => {
    const orm = new OrganizationOrmEntity();
    orm.id = randomUUID();
    orm.name = 'Engenharia Horizonte Ltda';
    orm.legalName = 'Horizonte Engenharia e Obras Ltda';
    orm.logoUrl = 's3://local-organizations/logo.png';

    const domain = OrganizationMapper.toDomain(orm);
    const contract = OrganizationMapper.toContract(domain);

    expect(domain.name.value).toBe('Engenharia Horizonte Ltda');
    expect(contract).toEqual({
      id: orm.id,
      name: 'Engenharia Horizonte Ltda',
      slug: 'engenharia-horizonte-ltda',
      logoUrl: 's3://local-organizations/logo.png',
      parentId: null,
    });
  });
});
