import { ValueObject } from '../../../../shared/domain/value-objects/value-object';

interface OrganizationNameProps extends Record<string, unknown> {
  value: string;
}

export class OrganizationName extends ValueObject<OrganizationNameProps> {
  private constructor(props: OrganizationNameProps) {
    super(props);
  }

  static create(value: string): OrganizationName {
    const normalized = value.trim().replace(/\s+/g, ' ');

    if (!normalized) {
      throw new Error('Organization name is required.');
    }

    if (normalized.length > 160) {
      throw new Error('Organization name must have at most 160 characters.');
    }

    return new OrganizationName({ value: normalized });
  }

  get value(): string {
    return this.props.value;
  }
}
