import { AggregateRoot } from '../../../../shared/domain/entities/aggregate-root';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { TechnicalTagCategory } from '../value-objects/technical-tag-category.vo';
import { TechnicalTagSlug } from '../value-objects/technical-tag-slug.vo';
import { TechnicalTagStatus } from '../value-objects/technical-tag-status.vo';

export interface TechnicalTagProps {
  organizationId: OrganizationId;
  name: string;
  slug: TechnicalTagSlug;
  category: TechnicalTagCategory;
  description?: string | null;
  status: TechnicalTagStatus;
  createdBy: string;
  updatedBy?: string | null;
  archivedAt?: Date | null;
  deprecatedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TechnicalTag extends AggregateRoot<TechnicalTagProps> {
  private constructor(props: TechnicalTagProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(params: {
    organizationId: OrganizationId;
    name: string;
    category: TechnicalTagCategory;
    description?: string | null;
    createdBy: string;
    status?: TechnicalTagStatus;
  }): TechnicalTag {
    const name = this.normalizeName(params.name);
    const actor = this.normalizeActor(params.createdBy);

    return new TechnicalTag({
      organizationId: params.organizationId,
      name,
      slug: TechnicalTagSlug.create(name),
      category: params.category,
      description: this.normalizeDescription(params.description),
      status: params.status ?? TechnicalTagStatus.active(),
      createdBy: actor,
      updatedBy: actor,
      archivedAt: null,
      deprecatedAt: null,
    });
  }

  static restore(props: TechnicalTagProps, id: UniqueEntityId): TechnicalTag {
    return new TechnicalTag({
      ...props,
      name: this.normalizeName(props.name),
      description: this.normalizeDescription(props.description),
      createdBy: this.normalizeActor(props.createdBy),
      updatedBy: props.updatedBy ? this.normalizeActor(props.updatedBy) : null,
    }, id);
  }

  get id(): string { return this.getId().toString(); }
  get organizationId(): OrganizationId { return this.props.organizationId; }
  get name(): string { return this.props.name; }
  get slug(): string { return this.props.slug.value; }
  get category(): TechnicalTagCategory { return this.props.category; }
  get description(): string | null { return this.props.description ?? null; }
  get status(): TechnicalTagStatus { return this.props.status; }
  get createdBy(): string { return this.props.createdBy; }
  get updatedBy(): string | null { return this.props.updatedBy ?? null; }
  get createdAt(): Date { return this.props.createdAt ?? new Date(); }
  get updatedAt(): Date { return this.props.updatedAt ?? new Date(); }
  get archivedAt(): Date | null { return this.props.archivedAt ?? null; }
  get deprecatedAt(): Date | null { return this.props.deprecatedAt ?? null; }

  update(params: {
    name?: string;
    category?: TechnicalTagCategory;
    description?: string | null;
    status?: TechnicalTagStatus;
    updatedBy: string;
  }): void {
    if (params.name !== undefined) this.props.name = TechnicalTag.normalizeName(params.name);
    if (params.name !== undefined) this.props.slug = TechnicalTagSlug.create(this.props.name);
    if (params.category !== undefined) this.props.category = params.category;
    if (params.description !== undefined) this.props.description = TechnicalTag.normalizeDescription(params.description);
    if (params.status !== undefined) this.props.status = params.status;
    this.props.updatedBy = TechnicalTag.normalizeActor(params.updatedBy);
  }

  archive(actor: string): void {
    this.props.status = TechnicalTagStatus.create('archived');
    this.props.archivedAt = new Date();
    this.props.updatedBy = TechnicalTag.normalizeActor(actor);
  }

  deprecate(actor: string): void {
    this.props.status = TechnicalTagStatus.create('deprecated');
    this.props.deprecatedAt = new Date();
    this.props.updatedBy = TechnicalTag.normalizeActor(actor);
  }

  private static normalizeName(value: string): string {
    const name = value.trim().replace(/\s+/g, ' ');
    if (!name) throw new Error('Technical tag name is required.');
    if (name.length > 120) throw new Error('Technical tag name is too long.');
    return name;
  }

  private static normalizeActor(value: string): string {
    const actor = value.trim();
    if (!actor) throw new Error('Technical tag actor is required.');
    return actor;
  }

  private static normalizeDescription(value?: string | null): string | null {
    if (value == null) return null;
    const description = value.trim();
    return description ? description : null;
  }
}
