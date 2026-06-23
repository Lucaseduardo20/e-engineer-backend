import { ValueObject } from '../../../../shared/domain/value-objects/value-object';

export type KnowledgeItemStatusValue =
  | 'draft'
  | 'published'
  | 'archived'
  | 'deprecated';

export const knowledgeItemStatuses: KnowledgeItemStatusValue[] = [
  'draft',
  'published',
  'archived',
  'deprecated',
];

export class KnowledgeItemStatus extends ValueObject<{
  value: KnowledgeItemStatusValue;
}> {
  private constructor(value: KnowledgeItemStatusValue) {
    super({ value });
  }

  static draft(): KnowledgeItemStatus {
    return new KnowledgeItemStatus('draft');
  }

  static create(value: string): KnowledgeItemStatus {
    if (!knowledgeItemStatuses.includes(value as KnowledgeItemStatusValue)) {
      throw new Error(`Invalid knowledge item status: ${value}`);
    }

    return new KnowledgeItemStatus(value as KnowledgeItemStatusValue);
  }

  get value(): KnowledgeItemStatusValue {
    return this.props.value;
  }
}
