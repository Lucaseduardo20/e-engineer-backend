import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { TechnicalTag } from '../../domain/entities/technical-tag';
import { TechnicalTagCategory } from '../../domain/value-objects/technical-tag-category.vo';
import { TechnicalTagSlug } from '../../domain/value-objects/technical-tag-slug.vo';
import { TechnicalTagStatus } from '../../domain/value-objects/technical-tag-status.vo';
import { TechnicalTagOrmEntity } from '../persistence/typeorm/technical-tag.orm-entity';

export class TechnicalTagMapper {
  static toDomain(orm: TechnicalTagOrmEntity): TechnicalTag {
    return TechnicalTag.restore(
      {
        organizationId: OrganizationId.create(orm.organizationId),
        name: orm.name,
        slug: TechnicalTagSlug.create(orm.slug),
        category: TechnicalTagCategory.create(orm.category),
        description: orm.description,
        status: TechnicalTagStatus.create(orm.status),
        createdBy: orm.createdBy,
        updatedBy: orm.updatedBy,
        createdAt: orm.createdAt,
        updatedAt: orm.updatedAt,
        archivedAt: orm.archivedAt,
        deprecatedAt: orm.deprecatedAt,
      },
      new UniqueEntityId(orm.id),
    );
  }

  static toOrm(domain: TechnicalTag): TechnicalTagOrmEntity {
    return {
      id: domain.id,
      organizationId: domain.organizationId.toString(),
      name: domain.name,
      slug: domain.slug,
      category: domain.category.value,
      description: domain.description,
      status: domain.status.value,
      createdBy: domain.createdBy,
      updatedBy: domain.updatedBy,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      archivedAt: domain.archivedAt,
      deprecatedAt: domain.deprecatedAt,
    };
  }
}
