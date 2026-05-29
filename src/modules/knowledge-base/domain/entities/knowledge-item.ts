import { AggregateRoot } from '../../../../shared/domain/entities/aggregate-root';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { KnowledgeItemArchivedEvent } from '../events/knowledge-item-archived.event';
import { KnowledgeItemCreatedEvent } from '../events/knowledge-item-created.event';
import { KnowledgeItemPublishedEvent } from '../events/knowledge-item-published.event';
import { KnowledgeItemStatus } from '../value-objects/knowledge-item-status.vo';
import { KnowledgeItemType } from '../value-objects/knowledge-item-type.vo';
import { normalizeKnowledgeTags } from '../value-objects/knowledge-tag.vo';

export type KnowledgeContent = Record<string, unknown>;

export interface KnowledgeItemProps {
  organizationId: OrganizationId;
  title: string;
  description?: string | null;
  type: KnowledgeItemType;
  status: KnowledgeItemStatus;
  tags: string[];
  content?: KnowledgeContent | null;
  createdBy: string;
  updatedBy: string;
  publishedAt?: Date | null;
  archivedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class KnowledgeItem extends AggregateRoot<KnowledgeItemProps> {
  private constructor(props: KnowledgeItemProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(params: {
    organizationId: OrganizationId;
    title: string;
    description?: string | null;
    type: KnowledgeItemType;
    tags?: string[];
    content?: KnowledgeContent | null;
    createdBy: string;
  }): KnowledgeItem {
    const item = new KnowledgeItem({
      organizationId: params.organizationId,
      title: this.normalizeTitle(params.title),
      description: this.normalizeOptionalText(params.description),
      type: params.type,
      status: KnowledgeItemStatus.draft(),
      tags: normalizeKnowledgeTags(params.tags ?? []),
      content: this.normalizeContent(params.content),
      createdBy: this.normalizeActor(params.createdBy),
      updatedBy: this.normalizeActor(params.createdBy),
      publishedAt: null,
      archivedAt: null,
    });

    item.addDomainEvent(
      new KnowledgeItemCreatedEvent({
        aggregateId: item.id,
        organizationId: item.organizationId.toString(),
      }),
    );

    return item;
  }

  static restore(props: KnowledgeItemProps, id: UniqueEntityId): KnowledgeItem {
    return new KnowledgeItem(
      {
        ...props,
        title: this.normalizeTitle(props.title),
        description: this.normalizeOptionalText(props.description),
        tags: normalizeKnowledgeTags(props.tags),
        content: this.normalizeContent(props.content),
        createdBy: this.normalizeActor(props.createdBy),
        updatedBy: this.normalizeActor(props.updatedBy),
      },
      id,
    );
  }

  update(params: {
    title?: string;
    description?: string | null;
    tags?: string[];
    content?: KnowledgeContent | null;
    updatedBy: string;
  }): void {
    if (this.status.value === 'archived') {
      throw new Error('Archived knowledge items cannot be updated.');
    }

    if (params.title !== undefined) {
      this.props.title = KnowledgeItem.normalizeTitle(params.title);
    }

    if (params.description !== undefined) {
      this.props.description = KnowledgeItem.normalizeOptionalText(
        params.description,
      );
    }

    if (params.tags !== undefined) {
      this.props.tags = normalizeKnowledgeTags(params.tags);
    }

    if (params.content !== undefined) {
      this.props.content = KnowledgeItem.normalizeContent(params.content);
    }

    this.props.updatedBy = KnowledgeItem.normalizeActor(params.updatedBy);
  }

  publish(publishedBy: string): void {
    if (this.status.value !== 'draft') {
      throw new Error('Only draft knowledge items can be published.');
    }

    this.props.status = KnowledgeItemStatus.create('published');
    this.props.publishedAt = new Date();
    this.props.archivedAt = null;
    this.props.updatedBy = KnowledgeItem.normalizeActor(publishedBy);
    this.addDomainEvent(
      new KnowledgeItemPublishedEvent({
        aggregateId: this.id,
        organizationId: this.organizationId.toString(),
      }),
    );
  }

  archive(archivedBy: string): void {
    if (this.status.value === 'archived') {
      return;
    }

    this.props.status = KnowledgeItemStatus.create('archived');
    this.props.archivedAt = new Date();
    this.props.updatedBy = KnowledgeItem.normalizeActor(archivedBy);
    this.addDomainEvent(
      new KnowledgeItemArchivedEvent({
        aggregateId: this.id,
        organizationId: this.organizationId.toString(),
      }),
    );
  }

  moveToDraft(updatedBy: string): void {
    this.props.status = KnowledgeItemStatus.draft();
    this.props.updatedBy = KnowledgeItem.normalizeActor(updatedBy);
  }

  get id(): string {
    return this.getId().toString();
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | null {
    return this.props.description ?? null;
  }

  get type(): KnowledgeItemType {
    return this.props.type;
  }

  get status(): KnowledgeItemStatus {
    return this.props.status;
  }

  get tags(): string[] {
    return [...this.props.tags];
  }

  get content(): KnowledgeContent | null {
    return this.props.content ?? null;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get updatedBy(): string {
    return this.props.updatedBy;
  }

  get publishedAt(): Date | null {
    return this.props.publishedAt ?? null;
  }

  get archivedAt(): Date | null {
    return this.props.archivedAt ?? null;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  private static normalizeTitle(value: string): string {
    const title = value.trim();

    if (!title) {
      throw new Error('Knowledge item title is required.');
    }

    if (title.length > 180) {
      throw new Error('Knowledge item title must have at most 180 characters.');
    }

    return title;
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
      throw new Error('Knowledge item actor is required.');
    }

    return actor.slice(0, 120);
  }

  private static normalizeContent(
    content?: KnowledgeContent | null,
  ): KnowledgeContent | null {
    if (!content || Array.isArray(content) || typeof content !== 'object') {
      return null;
    }

    return content;
  }
}
