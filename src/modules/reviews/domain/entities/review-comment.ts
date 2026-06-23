import { Entity } from '../../../../shared/domain/entities/entity';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';

export interface ReviewCommentProps {
  organizationId: OrganizationId;
  reviewId: UniqueEntityId;
  authorUserId: string;
  body: string;
  createdAt: Date;
}

export class ReviewComment extends Entity<ReviewCommentProps> {
  private constructor(props: ReviewCommentProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(params: {
    organizationId: OrganizationId;
    reviewId: UniqueEntityId;
    authorUserId: string;
    body: string;
  }): ReviewComment {
    return new ReviewComment({
      organizationId: params.organizationId,
      reviewId: params.reviewId,
      authorUserId: this.normalizeAuthor(params.authorUserId),
      body: this.normalizeBody(params.body),
      createdAt: new Date(),
    });
  }

  static restore(props: ReviewCommentProps, id: UniqueEntityId): ReviewComment {
    return new ReviewComment(
      {
        ...props,
        authorUserId: this.normalizeAuthor(props.authorUserId),
        body: this.normalizeBody(props.body),
      },
      id,
    );
  }

  get id(): string {
    return this.getId().toString();
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }

  get reviewId(): UniqueEntityId {
    return this.props.reviewId;
  }

  get authorUserId(): string {
    return this.props.authorUserId;
  }

  get body(): string {
    return this.props.body;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private static normalizeAuthor(value: string): string {
    const author = value.trim();

    if (!author) {
      throw new Error('Review comment author is required.');
    }

    return author.slice(0, 120);
  }

  private static normalizeBody(value: string): string {
    const body = value.trim();

    if (!body) {
      throw new Error('Review comment body is required.');
    }

    if (body.length > 2000) {
      throw new Error('Review comment body must have at most 2000 characters.');
    }

    return body;
  }
}
