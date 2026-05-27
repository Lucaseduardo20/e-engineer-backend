import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Review } from '../../domain/entities/review';
import {
  REVIEW_REPOSITORY,
  type ReviewRepository,
} from '../../domain/repositories/review.repository';
import { Reviewer } from '../../domain/value-objects/reviewer.vo';
import { ReviewMapper } from '../../infrastructure/mappers/review.mapper';
import { ReviewResponseDto } from '../../presentation/dto/review-response.dto';

export interface CreateReviewInput {
  organizationId: string;
  projectId: string;
  deliverableId?: string | null;
  documentId?: string | null;
  documentVersionId?: string | null;
  requestedBy: string;
  reviewers: string[];
  dueDate?: string | null;
  comment?: string | null;
}

@Injectable()
export class CreateReviewUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute(
    input: CreateReviewInput,
  ): Promise<Result<ReviewResponseDto, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const projectId = new UniqueEntityId(input.projectId);
      const projectExists = await this.reviewRepository.projectExists(
        projectId,
        organizationId,
      );

      if (!projectExists) {
        throw new Error('Project not found.');
      }

      const deliverableId = input.deliverableId
        ? new UniqueEntityId(input.deliverableId)
        : null;
      const documentId = input.documentId
        ? new UniqueEntityId(input.documentId)
        : null;
      const documentVersionId = input.documentVersionId
        ? new UniqueEntityId(input.documentVersionId)
        : null;

      if (deliverableId) {
        const deliverableExists = await this.reviewRepository.deliverableExists(
          deliverableId,
          projectId,
          organizationId,
        );

        if (!deliverableExists) {
          throw new Error('Deliverable not found.');
        }
      }

      if (documentId) {
        const documentExists = await this.reviewRepository.documentExists(
          documentId,
          projectId,
          organizationId,
        );

        if (!documentExists) {
          throw new Error('Document not found.');
        }
      }

      if (documentVersionId) {
        const documentVersionExists =
          await this.reviewRepository.documentVersionExists(
            documentVersionId,
            organizationId,
          );

        if (!documentVersionExists) {
          throw new Error('Document version not found.');
        }
      }

      const reviewerIds = [...new Set(input.reviewers)];
      const reviewersExist = await this.reviewRepository.usersExist(
        reviewerIds,
        organizationId,
      );

      if (!reviewersExist) {
        throw new Error('One or more reviewers were not found.');
      }

      const review = Review.create({
        organizationId,
        projectId,
        deliverableId,
        documentId,
        documentVersionId,
        requestedBy: input.requestedBy,
        reviewers: reviewerIds.map((reviewerId) => Reviewer.create(reviewerId)),
        dueDate: input.dueDate,
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
