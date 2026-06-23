import { Entity } from '../../../../shared/domain/entities/entity';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { OrganizationRole } from '../value-objects/organization-role';

export interface OrganizationMemberProps {
  organizationId: OrganizationId;
  userId: UniqueEntityId;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  isPlatformAdmin?: boolean;
  role: OrganizationRole;
}

export class OrganizationMember extends Entity<OrganizationMemberProps> {
  private constructor(props: OrganizationMemberProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static restore(
    props: OrganizationMemberProps,
    id: UniqueEntityId,
  ): OrganizationMember {
    return new OrganizationMember(props, id);
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }

  get userId(): UniqueEntityId {
    return this.props.userId;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get email(): string {
    return this.props.email;
  }

  get avatarUrl(): string | null {
    return this.props.avatarUrl ?? null;
  }

  get isPlatformAdmin(): boolean {
    return this.props.isPlatformAdmin ?? false;
  }

  get role(): OrganizationRole {
    return this.props.role;
  }
}
