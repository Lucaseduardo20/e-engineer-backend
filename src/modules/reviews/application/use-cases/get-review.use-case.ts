import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type { ReviewDetail } from '../../../../shared/contracts/dashboard.contracts';
import {
  REVIEW_REPOSITORY,
  type ReviewRepository,
} from '../../domain/repositories/review.repository';

export interface GetReviewInput {
  organizationId: string;
  reviewId: string;
}

@Injectable()
export class GetReviewUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: ReviewRepository,
  ) {}

  execute(input: GetReviewInput): Promise<ReviewDetail | null> {
    return this.reviewRepository.getById(
      new UniqueEntityId(input.reviewId),
      OrganizationId.create(input.organizationId),
    );
  }
}
