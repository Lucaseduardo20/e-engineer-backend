export const TECHNICAL_TAG_CATEGORIES = [
  'project_type',
  'technical_discipline',
  'document_type',
  'operational_pain',
  'client_context',
  'project_stage',
  'knowledge_purpose',
] as const;

export type TechnicalTagCategoryValue = (typeof TECHNICAL_TAG_CATEGORIES)[number];

export class TechnicalTagCategory {
  private constructor(public readonly value: TechnicalTagCategoryValue) {}

  static create(value: string): TechnicalTagCategory {
    if (
      !TECHNICAL_TAG_CATEGORIES.includes(value as TechnicalTagCategoryValue)
    ) {
      throw new Error('Technical tag category is invalid.');
    }

    return new TechnicalTagCategory(value as TechnicalTagCategoryValue);
  }
}
