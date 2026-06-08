import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { TypeOrmTenantScopedRepository } from '../../../../shared/infrastructure/persistence/typeorm/typeorm-tenant-scoped.repository';
import { TechnicalTag } from '../../domain/entities/technical-tag';
import type { FindTechnicalTagsParams, TechnicalTagRepository as TechnicalTagRepositoryPort } from '../../domain/repositories/technical-tag.repository';
import { TechnicalTagMapper } from '../mappers/technical-tag.mapper';
import { TechnicalTagOrmEntity } from '../persistence/typeorm/technical-tag.orm-entity';

@Injectable()
export class TypeOrmTechnicalTagRepository
  extends TypeOrmTenantScopedRepository<TechnicalTagOrmEntity>
  implements TechnicalTagRepositoryPort
{
  constructor(@InjectRepository(TechnicalTagOrmEntity) repository: Repository<TechnicalTagOrmEntity>) {
    super(repository);
  }

  async save(tag: TechnicalTag): Promise<void> {
    await this.saveOrm(TechnicalTagMapper.toOrm(tag));
  }

  async findById(id: UniqueEntityId, organizationId: OrganizationId): Promise<TechnicalTag | null> {
    const orm = await this.findOneById(id.toString(), { organizationId });
    return orm ? TechnicalTagMapper.toDomain(orm) : null;
  }

  async findBySlug(slug: string, organizationId: OrganizationId): Promise<TechnicalTag | null> {
    const orm = await this.repository.findOne({
      where: { organizationId: organizationId.toString(), slug },
    });
    return orm ? TechnicalTagMapper.toDomain(orm) : null;
  }

  existsBySlug(slug: string, organizationId: OrganizationId): Promise<boolean> {
    return this.repository.exists({ where: { organizationId: organizationId.toString(), slug } });
  }

  async findMany(filters: FindTechnicalTagsParams): Promise<TechnicalTag[]> {
    const qb = this.repository.createQueryBuilder('tag')
      .where('tag.organizationId = :organizationId', { organizationId: filters.organizationId })
      .orderBy('tag.name', 'ASC');

    if (filters.category) qb.andWhere('tag.category = :category', { category: filters.category });
    if (filters.status) qb.andWhere('tag.status = :status', { status: filters.status });
    if (!filters.includeArchived) qb.andWhere('tag.status != :archived', { archived: 'archived' });
    if (filters.search) qb.andWhere('(tag.name ILIKE :q OR tag.slug ILIKE :q)', { q: `%${filters.search}%` });
    if (filters.limit) qb.take(filters.limit);
    if (filters.page && filters.limit) qb.skip((filters.page - 1) * filters.limit);

    return (await qb.getMany()).map(TechnicalTagMapper.toDomain);
  }

  async count(filters: FindTechnicalTagsParams): Promise<number> {
    const qb = this.repository.createQueryBuilder('tag')
      .where('tag.organizationId = :organizationId', { organizationId: filters.organizationId });
    if (filters.category) qb.andWhere('tag.category = :category', { category: filters.category });
    if (filters.status) qb.andWhere('tag.status = :status', { status: filters.status });
    if (!filters.includeArchived) qb.andWhere('tag.status != :archived', { archived: 'archived' });
    if (filters.search) qb.andWhere('(tag.name ILIKE :q OR tag.slug ILIKE :q)', { q: `%${filters.search}%` });
    return qb.getCount();
  }

  async countUsageByTagIds(
    tagIds: string[],
    organizationId: OrganizationId,
  ): Promise<Map<string, number>> {
    if (tagIds.length === 0) return new Map();

    const rows = await this.repository.manager.query<Array<{ tag_id: string; usage_count: string }>>(
      `
        SELECT tag_id, COUNT(*)::text AS usage_count
        FROM knowledge_item_tags
        WHERE organization_id = $1
          AND tag_id = ANY($2::uuid[])
        GROUP BY tag_id
      `,
      [organizationId.toString(), tagIds],
    );

    return new Map(rows.map((row) => [row.tag_id, Number(row.usage_count)]));
  }
}
