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
  avatarUrl?: string | null;
  isPlatformAdmin: boolean;
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
    avatarUrl?: string | null;
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
      avatarUrl: normalizeNullableText(params.avatarUrl, 500),
      isPlatformAdmin: false,
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

  updateProfile(params: {
    name?: string;
    email?: string;
    avatarUrl?: string | null;
  }): void {
    if (params.name !== undefined) {
      const name = params.name.trim();

      if (!name) {
        throw new InvalidUserNameError();
      }

      this.props.name = name;
    }

    if (params.email !== undefined) {
      this.props.email = Email.create(params.email);
    }

    if (params.avatarUrl !== undefined) {
      this.props.avatarUrl = normalizeNullableText(params.avatarUrl, 500);
    }

    this.props.updatedAt = new Date();
  }

  updatePassword(rawPassword: string): void {
    this.props.password = Password.create(rawPassword);
    this.props.updatedAt = new Date();
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

  get avatarUrl(): string | null {
    return this.props.avatarUrl ?? null;
  }

  get isPlatformAdmin(): boolean {
    return this.props.isPlatformAdmin;
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

function normalizeNullableText(
  value: string | null | undefined,
  maxLength: number,
): string | null {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLength) {
    throw new Error(`Value must have at most ${maxLength} characters.`);
  }

  return normalized;
}
