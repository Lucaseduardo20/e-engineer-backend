import { OrganizationId } from '../../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../../shared/domain/value-objects/unique-entity-id';
import { User } from '../../../domain/entities/user';
import { Email } from '../../../domain/value-objects/email';
import { Password } from '../../../domain/value-objects/password';
import { UserOrmEntity } from '../typeorm/user.orm-entity';

export class UserMapper {
  static toDomain(ormEntity: UserOrmEntity): User {
    return User.restore(
      {
        organizationId: OrganizationId.create(ormEntity.organizationId),
        email: Email.create(ormEntity.email),
        password: Password.fromHash(ormEntity.password),
        name: ormEntity.name,
        createdAt: ormEntity.createdAt,
        updatedAt: ormEntity.updatedAt,
        lastLoginAt: ormEntity.lastLoginAt,
      },
      new UniqueEntityId(ormEntity.id),
    );
  }

  static toOrm(user: User): UserOrmEntity {
    const ormEntity = new UserOrmEntity();

    ormEntity.id = user.id;
    ormEntity.organizationId = user.organizationId.toString();
    ormEntity.email = user.email.toString();
    ormEntity.password = user.password.getHash();
    ormEntity.name = user.name;
    ormEntity.lastLoginAt = user.lastLoginAt ?? null;

    return ormEntity;
  }
}
