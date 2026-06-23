import { ValueObject } from '../../../../shared/domain/value-objects/value-object';

const allowedOrganizationRoles = [
  'owner',
  'admin',
  'manager',
  'project_manager',
  'estimator',
  'finance',
  'member',
] as const;

export type OrganizationRoleValue = (typeof allowedOrganizationRoles)[number];

interface OrganizationRoleProps extends Record<string, unknown> {
  value: OrganizationRoleValue;
}

export class OrganizationRole extends ValueObject<OrganizationRoleProps> {
  private constructor(props: OrganizationRoleProps) {
    super(props);
  }

  static create(value: string): OrganizationRole {
    if (allowedOrganizationRoles.includes(value as OrganizationRoleValue)) {
      return new OrganizationRole({ value: value as OrganizationRoleValue });
    }

    return new OrganizationRole({ value: 'member' });
  }

  get value(): OrganizationRoleValue {
    return this.props.value;
  }
}
