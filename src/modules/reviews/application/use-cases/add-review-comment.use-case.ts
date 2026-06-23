import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type { ReviewComment as ReviewCommentContract } from '../../../../shared/contracts/dashboard.contracts';
import { ReviewComment } from '../../domain/entities/review-comment';
import {
  REVIEW_COMMENT_REPOSITORY,
  type ReviewCommentRepository,
} from '../../domain/repositories/review-comment.repository';
import {
  REVIEW_REPOSITORY,
  type ReviewRepository,
} from '../../domain/repositories/review.repository';
import { ReviewCommentMapper } from '../../infrastructure/mappers/review-comment.mapper';

export interface AddReviewCommentInput {
  organizationId: string;
  reviewId: string;
  actorUserId: string;
  body: string;
}

@Injectable()
export class AddReviewCommentUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: ReviewRepository,
    @Inject(REVIEW_COMMENT_REPOSITORY)
    private readonly reviewCommentRepository: ReviewCommentRepository,
  ) {}

  async execute(
    input: AddReviewCommentInput,
  ): Promise<Result<ReviewCommentContract, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const reviewId = new UniqueEntityId(input.reviewId);
      const review = await this.reviewRepository.findById(reviewId, organizationId);

      if (!review) {
        throw new Error('Review not found.');
      }

      const role = await this.reviewRepository.getMembershipRole(
        input.actorUserId,
        organizationId,
      );
      const canOverride = role === 'owner' || role === 'admin';
      const isInvolved =
        review.requestedBy === input.actorUserId ||
        review.reviewers.some((reviewer) => reviewer.userId === input.actorUserId) ||
        review.reviewedBy === input.actorUserId;

      if (!canOverride && !isInvolved) {
        throw new Error('User is not authorized to comment on this review.');
      }

      const comment = ReviewComment.create({
        organizationId,
        reviewId,
        authorUserId: input.actorUserId,
        body: input.body,
      });
      await this.reviewCommentRepository.save(comment);

      return Result.ok(ReviewCommentMapper.toResponse(comment));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
