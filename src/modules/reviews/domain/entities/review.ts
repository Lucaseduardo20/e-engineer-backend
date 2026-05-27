import { AggregateRoot } from '../../../../shared/domain/entities/aggregate-root';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Reviewer } from '../value-objects/reviewer.vo';
import { ReviewStatus } from '../value-objects/review-status.vo';

export interface ReviewProps {
  organizationId: OrganizationId;
  projectId: UniqueEntityId;
  deliverableId?: UniqueEntityId | null;
  documentId?: UniqueEntityId | null;
  documentVersionId?: UniqueEntityId | null;
  requestedBy: string;
  reviewers: Reviewer[];
  status: ReviewStatus;
  dueDate?: string | null;
  comment?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  decisionComment?: string | null;
}

export class Review extends AggregateRoot<ReviewProps> {
  private constructor(props: ReviewProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(params: {
    organizationId: OrganizationId;
    projectId: UniqueEntityId;
    deliverableId?: UniqueEntityId | null;
    documentId?: UniqueEntityId | null;
    documentVersionId?: UniqueEntityId | null;
    requestedBy: string;
    reviewers: Reviewer[];
    dueDate?: string | null;
    comment?: string | null;
  }): Review {
    return new Review({
      organizationId: params.organizationId,
      projectId: params.projectId,
      deliverableId: params.deliverableId ?? null,
      documentId: params.documentId ?? null,
      documentVersionId: params.documentVersionId ?? null,
      requestedBy: this.normalizePerson(params.requestedBy, 'Review requester'),
      reviewers: this.normalizeReviewers(params.reviewers),
      status: ReviewStatus.pending(),
      dueDate: this.normalizeDueDate(params.dueDate),
      comment: this.normalizeOptionalText(params.comment),
      reviewedBy: null,
      reviewedAt: null,
      decisionComment: null,
    });
  }

  static restore(props: ReviewProps, id: UniqueEntityId): Review {
    return new Review(
      {
        ...props,
        deliverableId: props.deliverableId ?? null,
        documentId: props.documentId ?? null,
        documentVersionId: props.documentVersionId ?? null,
        requestedBy: this.normalizePerson(
          props.requestedBy,
          'Review requester',
        ),
        reviewers: this.normalizeReviewers(props.reviewers),
        dueDate: this.normalizeDueDate(props.dueDate),
        comment: this.normalizeOptionalText(props.comment),
        reviewedBy: props.reviewedBy
          ? this.normalizePerson(props.reviewedBy, 'Reviewer')
          : null,
        reviewedAt: props.reviewedAt ?? null,
        decisionComment: this.normalizeOptionalText(props.decisionComment),
      },
      id,
    );
  }

  approve(params: {
    actorUserId: string;
    canOverride: boolean;
    comment?: string | null;
  }): void {
    this.ensureCanDecide(params.actorUserId, params.canOverride);
    this.props.status = ReviewStatus.create('approved');
    this.props.reviewedBy = Review.normalizePerson(
      params.actorUserId,
      'Reviewer',
    );
    this.props.reviewedAt = new Date();
    this.props.decisionComment = Review.normalizeOptionalText(params.comment);
  }

  reject(params: {
    actorUserId: string;
    canOverride: boolean;
    comment?: string | null;
  }): void {
    this.ensureCanDecide(params.actorUserId, params.canOverride);
    this.props.status = ReviewStatus.create('rejected');
    this.props.reviewedBy = Review.normalizePerson(
      params.actorUserId,
      'Reviewer',
    );
    this.props.reviewedAt = new Date();
    this.props.decisionComment = Review.normalizeOptionalText(params.comment);
  }

  get id(): string {
    return this.getId().toString();
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }

  get projectId(): UniqueEntityId {
    return this.props.projectId;
  }

  get deliverableId(): UniqueEntityId | null {
    return this.props.deliverableId ?? null;
  }

  get documentId(): UniqueEntityId | null {
    return this.props.documentId ?? null;
  }

  get documentVersionId(): UniqueEntityId | null {
    return this.props.documentVersionId ?? null;
  }

  get requestedBy(): string {
    return this.props.requestedBy;
  }

  get reviewers(): Reviewer[] {
    return [...this.props.reviewers];
  }

  get status(): ReviewStatus {
    return this.props.status;
  }

  get dueDate(): string | null {
    return this.props.dueDate ?? null;
  }

  get comment(): string | null {
    return this.props.comment ?? null;
  }

  get reviewedBy(): string | null {
    return this.props.reviewedBy ?? null;
  }

  get reviewedAt(): Date | null {
    return this.props.reviewedAt ?? null;
  }

  get decisionComment(): string | null {
    return this.props.decisionComment ?? null;
  }

  private ensureCanDecide(actorUserId: string, canOverride: boolean): void {
    const actor = Review.normalizePerson(actorUserId, 'Reviewer');

    if (!this.status.canBeDecided()) {
      throw new Error('Review has already been decided.');
    }

    if (canOverride) {
      return;
    }

    const isReviewer = this.reviewers.some(
      (reviewer) => reviewer.userId === actor,
    );

    if (!isReviewer) {
      throw new Error('User is not authorized to decide this review.');
    }
  }

  private static normalizeReviewers(reviewers: Reviewer[]): Reviewer[] {
    const unique = new Map<string, Reviewer>();

    for (const reviewer of reviewers) {
      unique.set(reviewer.userId, reviewer);
    }

    if (unique.size === 0) {
      throw new Error('Review must have at least one reviewer.');
    }

    return [...unique.values()].slice(0, 12);
  }

  private static normalizePerson(value: string, label: string): string {
    const normalized = value.trim();

    if (!normalized) {
      throw new Error(`${label} is required.`);
    }

    return normalized.slice(0, 120);
  }

  private static normalizeDueDate(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
      throw new Error('Review due date must be a valid ISO date.');
    }

    return value;
  }

  private static normalizeOptionalText(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const text = value.trim();
    return text.length ? text : null;
  }
}
