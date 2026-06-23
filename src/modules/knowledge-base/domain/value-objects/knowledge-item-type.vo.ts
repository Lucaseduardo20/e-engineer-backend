import { ValueObject } from '../../../../shared/domain/value-objects/value-object';

export type KnowledgeItemTypeValue =
  | 'technical_standard'
  | 'document_model'
  | 'project_reference'
  | 'lesson_learned'
  | 'review_checklist'
  | 'delivery_standard'
  | 'zoning_rule_reference'
  | 'project_template';

export const knowledgeItemTypes: KnowledgeItemTypeValue[] = [
  'technical_standard',
  'document_model',
  'project_reference',
  'lesson_learned',
  'review_checklist',
  'delivery_standard',
  'zoning_rule_reference',
  'project_template',
];

export class KnowledgeItemType extends ValueObject<{
  value: KnowledgeItemTypeValue;
}> {
  private constructor(value: KnowledgeItemTypeValue) {
    super({ value });
  }

  static create(value: string): KnowledgeItemType {
    if (!knowledgeItemTypes.includes(value as KnowledgeItemTypeValue)) {
      throw new Error(`Invalid knowledge item type: ${value}`);
    }

    return new KnowledgeItemType(value as KnowledgeItemTypeValue);
  }

  get value(): KnowledgeItemTypeValue {
    return this.props.value;
  }
}
