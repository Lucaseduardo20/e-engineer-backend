import { AggregateRoot } from '../../../../shared/domain/entities/aggregate-root';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { InvalidUserNameError } from '../errors/invalid-user-name.error';
import { UserCreatedEvent } from '../events/user-created.event';
import { Email } from '../value-objects/email';
import { Password } from '../value-objects/password';

export interface UserProps {
  organizationId: OrganizationId;
  email: Email;
  password: Password;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}

export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(params: {
    organizationId: OrganizationId;
    email: string;
    password: string;
    name: string;
  }): User {
    const name = params.name.trim();

    if (!name) {
      throw new InvalidUserNameError();
    }

    const now = new Date();
    const user = new User({
      organizationId: params.organizationId,
      email: Email.create(params.email),
      password: Password.create(params.password),
      name,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    });

    user.addDomainEvent(
      new UserCreatedEvent({
        userId: user.id,
        organizationId: user.organizationId.toString(),
        email: user.email.toString(),
      }),
    );

    return user;
  }

  static restore(props: UserProps, id: UniqueEntityId): User {
    return new User(props, id);
  }

  async verifyPassword(rawPassword: string): Promise<boolean> {
    return this.props.password.verify(rawPassword);
  }

  markLoggedIn(at = new Date()): void {
    this.props.lastLoginAt = at;
    this.props.updatedAt = at;
  }

  get id(): string {
    return this.getId().toString();
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }

  get email(): Email {
    return this.props.email;
  }

  get password(): Password {
    return this.props.password;
  }

  get name(): string {
    return this.props.name;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get lastLoginAt(): Date | null | undefined {
    return this.props.lastLoginAt;
  }
}
