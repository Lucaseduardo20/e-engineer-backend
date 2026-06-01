export const TECHNICAL_TAG_STATUSES = [
  'active',
  'pending_review',
  'deprecated',
  'archived',
] as const;

export type TechnicalTagStatusValue = (typeof TECHNICAL_TAG_STATUSES)[number];

export class TechnicalTagStatus {
  private constructor(public readonly value: TechnicalTagStatusValue) {}

  static active(): TechnicalTagStatus {
    return new TechnicalTagStatus('active');
  }

  static create(value: string): TechnicalTagStatus {
    if (!TECHNICAL_TAG_STATUSES.includes(value as TechnicalTagStatusValue)) {
      throw new Error('Technical tag status is invalid.');
    }

    return new TechnicalTagStatus(value as TechnicalTagStatusValue);
  }
}
