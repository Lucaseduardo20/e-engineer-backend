import { ValueObject } from '../../../../shared/domain/value-objects/value-object';

export class KnowledgeTag extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  static create(value: string): KnowledgeTag {
    const tag = value.trim().replace(/\s+/g, ' ').toLowerCase();

    if (!tag) {
      throw new Error('Knowledge tag is required.');
    }

    if (tag.length > 48) {
      throw new Error('Knowledge tag must have at most 48 characters.');
    }

    return new KnowledgeTag(tag);
  }

  get value(): string {
    return this.props.value;
  }
}

export function normalizeKnowledgeTags(values: string[] = []): string[] {
  return [
    ...new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => KnowledgeTag.create(value).value),
    ),
  ].slice(0, 20);
}
