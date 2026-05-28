import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type { ReviewDetail } from '../../../../shared/contracts/dashboard.contracts';
import {
  REVIEW_REPOSITORY,
  type ReviewRepository,
} from '../../domain/repositories/review.repository';
import {
  REVIEW_COMMENT_REPOSITORY,
  type ReviewCommentRepository,
} from '../../domain/repositories/review-comment.repository';

export interface GetReviewInput {
  organizationId: string;
  reviewId: string;
}

@Injectable()
export class GetReviewUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: ReviewRepository,
    @Inject(REVIEW_COMMENT_REPOSITORY)
    private readonly reviewCommentRepository: ReviewCommentRepository,
  ) {}

  async execute(input: GetReviewInput): Promise<ReviewDetail | null> {
    const organizationId = OrganizationId.create(input.organizationId);
    const reviewId = new UniqueEntityId(input.reviewId);
    const review = await this.reviewRepository.getById(reviewId, organizationId);

    if (!review) {
      return null;
    }

    return {
      ...review,
      comments: await this.reviewCommentRepository.listByReview(
        reviewId,
        organizationId,
      ),
    };
  }
}
