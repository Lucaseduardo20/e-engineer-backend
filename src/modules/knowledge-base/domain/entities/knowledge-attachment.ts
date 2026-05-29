import { Entity } from '../../../../shared/domain/entities/entity';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';

export interface KnowledgeAttachmentProps {
  organizationId: OrganizationId;
  knowledgeItemId: UniqueEntityId;
  fileId: UniqueEntityId;
  label: string;
  description?: string | null;
  createdBy: string;
  createdAt: Date;
}

export class KnowledgeAttachment extends Entity<KnowledgeAttachmentProps> {
  private constructor(props: KnowledgeAttachmentProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(params: {
    organizationId: OrganizationId;
    knowledgeItemId: UniqueEntityId;
    fileId: UniqueEntityId;
    label: string;
    description?: string | null;
    createdBy: string;
  }): KnowledgeAttachment {
    return new KnowledgeAttachment({
      organizationId: params.organizationId,
      knowledgeItemId: params.knowledgeItemId,
      fileId: params.fileId,
      label: this.normalizeLabel(params.label),
      description: this.normalizeOptionalText(params.description),
      createdBy: this.normalizeActor(params.createdBy),
      createdAt: new Date(),
    });
  }

  static restore(
    props: KnowledgeAttachmentProps,
    id: UniqueEntityId,
  ): KnowledgeAttachment {
    return new KnowledgeAttachment(props, id);
  }

  get id(): string {
    return this.getId().toString();
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }

  get knowledgeItemId(): UniqueEntityId {
    return this.props.knowledgeItemId;
  }

  get fileId(): UniqueEntityId {
    return this.props.fileId;
  }

  get label(): string {
    return this.props.label;
  }

  get description(): string | null {
    return this.props.description ?? null;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private static normalizeLabel(value: string): string {
    const label = value.trim();

    if (!label) {
      throw new Error('Knowledge attachment label is required.');
    }

    return label.slice(0, 120);
  }

  private static normalizeOptionalText(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const text = value.trim();
    return text.length ? text : null;
  }

  private static normalizeActor(value: string): string {
    const actor = value.trim();

    if (!actor) {
      throw new Error('Knowledge attachment actor is required.');
    }

    return actor.slice(0, 120);
  }
}
