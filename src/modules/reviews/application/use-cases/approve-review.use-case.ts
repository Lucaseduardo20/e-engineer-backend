import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import {
  REVIEW_REPOSITORY,
  type ReviewRepository,
} from '../../domain/repositories/review.repository';
import { ReviewMapper } from '../../infrastructure/mappers/review.mapper';
import { ReviewResponseDto } from '../../presentation/dto/review-response.dto';

export interface ApproveReviewInput {
  organizationId: string;
  reviewId: string;
  actorUserId: string;
  comment?: string | null;
}

@Injectable()
export class ApproveReviewUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute(
    input: ApproveReviewInput,
  ): Promise<Result<ReviewResponseDto, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const review = await this.reviewRepository.findById(
        new UniqueEntityId(input.reviewId),
        organizationId,
      );

      if (!review) {
        throw new Error('Review not found.');
      }

      const role = await this.reviewRepository.getMembershipRole(
        input.actorUserId,
        organizationId,
      );
      review.approve({
        actorUserId: input.actorUserId,
        canOverride: role === 'owner' || role === 'admin',
        comment: input.comment,
      });

      await this.reviewRepository.save(review);

      return Result.ok(ReviewMapper.toResponse(review));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
