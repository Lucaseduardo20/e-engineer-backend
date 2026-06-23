import { randomUUID } from 'crypto';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { OrganizationName } from '../value-objects/organization-name';
import { Organization } from './organization';

describe('Organization', () => {
  it('normalizes organization names without losing legal identity data', () => {
    const organization = Organization.create({
      name: '  Engenharia   Horizonte  Ltda  ',
      legalName: '  Horizonte Engenharia e Obras Ltda  ',
    });

    expect(organization.name.value).toBe('Engenharia Horizonte Ltda');
    expect(organization.legalName).toBe('Horizonte Engenharia e Obras Ltda');
  });

  it('rejects empty organization names', () => {
    expect(() => Organization.create({ name: '   ' })).toThrow(
      'Organization name is required.',
    );
  });

  it('restores an existing organization with its persisted id', () => {
    const id = randomUUID();
    const organization = Organization.restore(
      {
        name: OrganizationName.create('Nucleo Tecnico'),
        legalName: null,
        logoUrl: null,
      },
      new UniqueEntityId(id),
    );

    expect(organization.id).toBe(id);
  });
});
