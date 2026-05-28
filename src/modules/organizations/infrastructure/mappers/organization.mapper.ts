import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type { Organization as OrganizationContract } from '../../../../shared/contracts/dashboard.contracts';
import { Organization } from '../../domain/entities/organization';
import { OrganizationName } from '../../domain/value-objects/organization-name';
import { OrganizationOrmEntity } from '../persistence/typeorm/organization.orm-entity';

export class OrganizationMapper {
  static toDomain(ormEntity: OrganizationOrmEntity): Organization {
    return Organization.restore(
      {
        name: OrganizationName.create(ormEntity.name),
        legalName: ormEntity.legalName,
        logoUrl: ormEntity.logoUrl,
      },
      new UniqueEntityId(ormEntity.id),
    );
  }

  static toContract(organization: Organization): OrganizationContract {
    return {
      id: organization.id,
      name: organization.name.value,
      slug: slugify(organization.name.value),
      logoUrl: organization.logoUrl,
      parentId: null,
    };
  }
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
