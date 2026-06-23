import { ValueObject } from '../../../../shared/domain/value-objects/value-object';

export type ReviewStatusValue = 'pending' | 'approved' | 'rejected' | 'overdue';

export const reviewStatusValues: ReviewStatusValue[] = [
  'pending',
  'approved',
  'rejected',
  'overdue',
];

export class ReviewStatus extends ValueObject<{ value: ReviewStatusValue }> {
  private constructor(value: ReviewStatusValue) {
    super({ value });
  }

  static pending(): ReviewStatus {
    return new ReviewStatus('pending');
  }

  static create(value: string): ReviewStatus {
    if (!reviewStatusValues.includes(value as ReviewStatusValue)) {
      throw new Error(`Invalid review status: ${value}`);
    }

    return new ReviewStatus(value as ReviewStatusValue);
  }

  canBeDecided(): boolean {
    return this.value === 'pending' || this.value === 'overdue';
  }

  get value(): ReviewStatusValue {
    return this.props.value;
  }
}
