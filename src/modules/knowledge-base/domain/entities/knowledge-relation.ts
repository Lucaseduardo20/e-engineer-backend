import { Entity } from '../../../../shared/domain/entities/entity';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';

export type KnowledgeRelationTargetType =
  | 'project'
  | 'deliverable'
  | 'document'
  | 'document_version'
  | 'review'
  | 'template';

export type KnowledgeRelationType =
  | 'reference_for'
  | 'based_on'
  | 'model_for'
  | 'lesson_from'
  | 'standard_for'
  | 'checklist_for';

export const knowledgeRelationTargetTypes: KnowledgeRelationTargetType[] = [
  'project',
  'deliverable',
  'document',
  'document_version',
  'review',
  'template',
];

export const knowledgeRelationTypes: KnowledgeRelationType[] = [
  'reference_for',
  'based_on',
  'model_for',
  'lesson_from',
  'standard_for',
  'checklist_for',
];

export interface KnowledgeRelationProps {
  organizationId: OrganizationId;
  knowledgeItemId: UniqueEntityId;
  targetType: KnowledgeRelationTargetType;
  targetId: UniqueEntityId;
  relationType: KnowledgeRelationType;
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
      targetType: this.normalizeTargetType(params.targetType),
      targetId: params.targetId,
      relationType: this.normalizeRelationType(params.relationType),
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

  get targetType(): KnowledgeRelationTargetType {
    return this.props.targetType;
  }

  get targetId(): UniqueEntityId {
    return this.props.targetId;
  }

  get relationType(): KnowledgeRelationType {
    return this.props.relationType;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private static normalizeTargetType(value: string): KnowledgeRelationTargetType {
    const code = value.trim().toLowerCase() as KnowledgeRelationTargetType;

    if (!knowledgeRelationTargetTypes.includes(code)) {
      throw new Error('Knowledge relation target type is invalid.');
    }

    return code;
  }

  private static normalizeRelationType(value: string): KnowledgeRelationType {
    const code = value.trim().toLowerCase() as KnowledgeRelationType;

    if (!knowledgeRelationTypes.includes(code)) {
      throw new Error('Knowledge relation relation type is invalid.');
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
