import { AggregateRoot } from '../../../../shared/domain/entities/aggregate-root';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { OrganizationName } from '../value-objects/organization-name';

export interface OrganizationProps {
  name: OrganizationName;
  legalName?: string | null;
  logoUrl?: string | null;
}

export class Organization extends AggregateRoot<OrganizationProps> {
  private constructor(props: OrganizationProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(params: {
    name: string;
    legalName?: string | null;
  }): Organization {
    return new Organization({
      name: OrganizationName.create(params.name),
      legalName: normalizeLegalName(params.legalName),
      logoUrl: null,
    });
  }

  static restore(props: OrganizationProps, id: UniqueEntityId): Organization {
    return new Organization(props, id);
  }

  updateProfile(params: { name?: string; legalName?: string | null }): void {
    if (params.name !== undefined) {
      this.props.name = OrganizationName.create(params.name);
    }

    if (params.legalName !== undefined) {
      this.props.legalName = normalizeLegalName(params.legalName);
    }
  }

  updateLogo(logoUrl: string | null): void {
    this.props.logoUrl = normalizeLogoUrl(logoUrl);
  }

  get id(): string {
    return this.getId().toString();
  }

  get name(): OrganizationName {
    return this.props.name;
  }

  get legalName(): string | null {
    return this.props.legalName ?? null;
  }

  get logoUrl(): string | null {
    return this.props.logoUrl ?? null;
  }
}

function normalizeLegalName(value?: string | null): string | null {
  const normalized = value?.trim().replace(/\s+/g, ' ') ?? '';

  if (!normalized) {
    return null;
  }

  if (normalized.length > 180) {
    throw new Error(
      'Organization legal name must have at most 180 characters.',
    );
  }

  return normalized;
}

function normalizeLogoUrl(value?: string | null): string | null {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    return null;
  }

  if (normalized.length > 500) {
    throw new Error('Organization logo URL must have at most 500 characters.');
  }

  return normalized;
}
