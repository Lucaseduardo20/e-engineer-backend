import { Entity } from '../../../../shared/domain/entities/entity';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';

export interface KnowledgeRelationProps {
  organizationId: OrganizationId;
  knowledgeItemId: UniqueEntityId;
  targetType: string;
  targetId: UniqueEntityId;
  relationType: string;
  createdBy: string;
  createdAt: Date;
}

export class KnowledgeRelation extends Entity<KnowledgeRelationProps> {
  private constructor(props: KnowledgeRelationProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(params: {
    organizationId: OrganizationId;
    knowledgeItemId: UniqueEntityId;
    targetType: string;
    targetId: UniqueEntityId;
    relationType: string;
    createdBy: string;
  }): KnowledgeRelation {
    return new KnowledgeRelation({
      organizationId: params.organizationId,
      knowledgeItemId: params.knowledgeItemId,
      targetType: this.normalizeCode(params.targetType, 'target type'),
      targetId: params.targetId,
      relationType: this.normalizeCode(params.relationType, 'relation type'),
      createdBy: this.normalizeActor(params.createdBy),
      createdAt: new Date(),
    });
  }

  static restore(
    props: KnowledgeRelationProps,
    id: UniqueEntityId,
  ): KnowledgeRelation {
    return new KnowledgeRelation(props, id);
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

  get targetType(): string {
    return this.props.targetType;
  }

  get targetId(): UniqueEntityId {
    return this.props.targetId;
  }

  get relationType(): string {
    return this.props.relationType;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private static normalizeCode(value: string, label: string): string {
    const code = value.trim().toLowerCase();

    if (!/^[a-z][a-z0-9_]{1,39}$/.test(code)) {
      throw new Error(`Knowledge relation ${label} is invalid.`);
    }

    return code;
  }

  private static normalizeActor(value: string): string {
    const actor = value.trim();

    if (!actor) {
      throw new Error('Knowledge relation actor is required.');
    }

    return actor.slice(0, 120);
  }
}
