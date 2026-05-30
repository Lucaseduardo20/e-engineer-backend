import { ValueObject } from '../../../../shared/domain/value-objects/value-object';

export type KnowledgeVisibilityValue = 'organization' | 'restricted';

export const knowledgeVisibilities: KnowledgeVisibilityValue[] = [
  'organization',
  'restricted',
];

export class KnowledgeVisibility extends ValueObject<{
  value: KnowledgeVisibilityValue;
}> {
  private constructor(value: KnowledgeVisibilityValue) {
    super({ value });
  }

  static default(): KnowledgeVisibility {
    return new KnowledgeVisibility('organization');
  }

  static create(value: string): KnowledgeVisibility {
    if (!knowledgeVisibilities.includes(value as KnowledgeVisibilityValue)) {
      throw new Error(`Invalid knowledge visibility: ${value}`);
    }

    return new KnowledgeVisibility(value as KnowledgeVisibilityValue);
  }

  get value(): KnowledgeVisibilityValue {
    return this.props.value;
  }
}
