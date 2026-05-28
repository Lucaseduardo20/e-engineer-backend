import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type { ReviewComment as ReviewCommentContract } from '../../../../shared/contracts/dashboard.contracts';
import { ReviewComment } from '../entities/review-comment';

export const REVIEW_COMMENT_REPOSITORY = Symbol('REVIEW_COMMENT_REPOSITORY');

export interface ReviewCommentRepository {
  save(comment: ReviewComment): Promise<void>;
  listByReview(
    reviewId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<ReviewCommentContract[]>;
}
