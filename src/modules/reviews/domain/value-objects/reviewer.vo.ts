import { ValueObject } from '../../../../shared/domain/value-objects/value-object';

export type ReviewerRole = 'reviewer' | 'lead_reviewer' | 'approver';

export interface ReviewerProps extends Record<string, unknown> {
  userId: string;
  role: ReviewerRole;
}

const reviewerRoles: ReviewerRole[] = ['reviewer', 'lead_reviewer', 'approver'];

export class Reviewer extends ValueObject<ReviewerProps> {
  private constructor(props: ReviewerProps) {
    super(props);
  }

  static create(input: string | ReviewerProps): Reviewer {
    const props =
      typeof input === 'string'
        ? { userId: input, role: 'reviewer' as ReviewerRole }
        : input;
    const userId = props.userId.trim();

    if (!userId) {
      throw new Error('Reviewer user id is required.');
    }

    if (!reviewerRoles.includes(props.role)) {
      throw new Error(`Invalid reviewer role: ${props.role}`);
    }

    return new Reviewer({ userId, role: props.role });
  }

  get userId(): string {
    return this.props.userId;
  }

  get role(): ReviewerRole {
    return this.props.role;
  }

  toJSON(): ReviewerProps {
    return { userId: this.userId, role: this.role };
  }
}
