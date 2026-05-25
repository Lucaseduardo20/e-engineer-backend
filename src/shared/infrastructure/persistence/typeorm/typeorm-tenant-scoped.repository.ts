import { Repository, FindOptionsWhere } from 'typeorm';
import { TenantScope } from '../../../application/tenancy/tenant-scope';
import { TenantScopedOrmEntity } from './tenant-scoped.orm-entity';

export abstract class TypeOrmTenantScopedRepository<
  TOrmEntity extends TenantScopedOrmEntity,
> {
  protected constructor(
    protected readonly repository: Repository<TOrmEntity>,
  ) {}

  protected findOneById(
    id: string,
    scope: TenantScope,
  ): Promise<TOrmEntity | null> {
    return this.repository.findOne({
      where: this.withTenantScope(scope, { id }),
    });
  }

  protected async existsById(id: string, scope: TenantScope): Promise<boolean> {
    return this.repository.exists({
      where: this.withTenantScope(scope, { id }),
    });
  }

  protected saveOrm(entity: TOrmEntity): Promise<TOrmEntity> {
    return this.repository.save(entity);
  }

  protected async deleteById(id: string, scope: TenantScope): Promise<void> {
    await this.repository.delete(this.withTenantScope(scope, { id }));
  }

  protected withTenantScope(
    scope: TenantScope,
    where: Record<string, unknown> = {},
  ): FindOptionsWhere<TOrmEntity> {
    return {
      ...where,
      organizationId: scope.organizationId.toString(),
    } as FindOptionsWhere<TOrmEntity>;
  }
}
