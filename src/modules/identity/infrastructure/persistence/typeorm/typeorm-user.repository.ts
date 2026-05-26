import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantScope } from '../../../../../shared/application/tenancy/tenant-scope';
import { OrganizationId } from '../../../../../shared/domain/value-objects/organization-id';
import { TypeOrmTenantScopedRepository } from '../../../../../shared/infrastructure/persistence/typeorm/typeorm-tenant-scoped.repository';
import { User } from '../../../domain/entities/user';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { UserMapper } from '../mappers/user.mapper';
import { UserOrmEntity } from './user.orm-entity';

@Injectable()
export class TypeOrmUserRepository
  extends TypeOrmTenantScopedRepository<UserOrmEntity>
  implements UserRepository
{
  constructor(
    @InjectRepository(UserOrmEntity)
    repository: Repository<UserOrmEntity>,
  ) {
    super(repository);
  }

  async save(user: User): Promise<void> {
    await this.saveOrm(UserMapper.toOrm(user));
  }

  async findByEmail(email: string): Promise<User | null> {
    const ormEntity = await this.repository.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    return ormEntity ? UserMapper.toDomain(ormEntity) : null;
  }

  async findById(id: string, scope: TenantScope): Promise<User | null> {
    const ormEntity = await this.findOneById(id, scope);

    return ormEntity ? UserMapper.toDomain(ormEntity) : null;
  }

  async findByOrganizationId(
    organizationId: OrganizationId,
    scope: TenantScope,
  ): Promise<User[]> {
    if (!organizationId.equals(scope.organizationId)) {
      return [];
    }

    const users = await this.repository.find({
      where: this.withTenantScope(scope),
      order: { name: 'ASC' },
    });

    return users.map((user) => UserMapper.toDomain(user));
  }
}
