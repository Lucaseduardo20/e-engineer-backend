import { ValueObject } from '../../../../shared/domain/value-objects/value-object';

export type DeliverableStatusValue =
  | 'todo'
  | 'in_progress'
  | 'done'
  | 'blocked';

const allowedStatuses: DeliverableStatusValue[] = [
  'todo',
  'in_progress',
  'done',
  'blocked',
];

export class DeliverableStatus extends ValueObject<{
  value: DeliverableStatusValue;
}> {
  private constructor(value: DeliverableStatusValue) {
    super({ value });
  }

  static todo(): DeliverableStatus {
    return new DeliverableStatus('todo');
  }

  static create(value: string): DeliverableStatus {
    if (!allowedStatuses.includes(value as DeliverableStatusValue)) {
      throw new Error(`Invalid deliverable status: ${value}`);
    }

    return new DeliverableStatus(value as DeliverableStatusValue);
  }

  static fromPersistence(value: string): DeliverableStatus {
    if (value === 'approved') {
      return new DeliverableStatus('done');
    }

    if (value === 'in_review' || value === 'in_progress') {
      return new DeliverableStatus('in_progress');
    }

    if (value === 'rejected' || value === 'overdue') {
      return new DeliverableStatus('blocked');
    }

    return DeliverableStatus.create(
      allowedStatuses.includes(value as DeliverableStatusValue)
        ? value
        : 'todo',
    );
  }

  get value(): DeliverableStatusValue {
    return this.props.value;
  }
}
