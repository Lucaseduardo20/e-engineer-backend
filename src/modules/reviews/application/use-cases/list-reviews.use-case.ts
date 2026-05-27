import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type {
  Paginated,
  ReviewSummary,
} from '../../../../shared/contracts/dashboard.contracts';
import {
  REVIEW_REPOSITORY,
  type ReviewRepository,
} from '../../domain/repositories/review.repository';

export interface ListReviewsInput {
  organizationId: string;
  page: number;
  pageSize: number;
  projectId?: string;
  deliverableId?: string;
  documentId?: string;
  status?: string;
}

@Injectable()
export class ListReviewsUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: ReviewRepository,
  ) {}

  execute(input: ListReviewsInput): Promise<Paginated<ReviewSummary>> {
    return this.reviewRepository.list(
      OrganizationId.create(input.organizationId),
      {
        page: input.page,
        pageSize: input.pageSize,
        projectId: input.projectId
          ? new UniqueEntityId(input.projectId)
          : undefined,
        deliverableId: input.deliverableId
          ? new UniqueEntityId(input.deliverableId)
          : undefined,
        documentId: input.documentId
          ? new UniqueEntityId(input.documentId)
          : undefined,
        status: input.status,
      },
    );
  }
}
