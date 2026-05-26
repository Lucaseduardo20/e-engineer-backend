import { ValueObject } from '../../../../shared/domain/value-objects/value-object';

export type ProjectStatusValue =
  | 'draft'
  | 'active'
  | 'planning'
  | 'in_progress'
  | 'in_review'
  | 'waiting_approval'
  | 'overdue'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

const allowedStatuses: ProjectStatusValue[] = [
  'draft',
  'active',
  'planning',
  'in_progress',
  'in_review',
  'waiting_approval',
  'overdue',
  'on_hold',
  'completed',
  'cancelled',
];

export class ProjectStatus extends ValueObject<{ value: ProjectStatusValue }> {
  private constructor(value: ProjectStatusValue) {
    super({ value });
  }

  static draft(): ProjectStatus {
    return new ProjectStatus('draft');
  }

  static create(value: string): ProjectStatus {
    if (!allowedStatuses.includes(value as ProjectStatusValue)) {
      throw new Error(`Invalid project status: ${value}`);
    }

    return new ProjectStatus(value as ProjectStatusValue);
  }

  get value(): ProjectStatusValue {
    return this.props.value;
  }
}
