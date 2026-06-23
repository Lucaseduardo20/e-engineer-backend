import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Review } from '../../domain/entities/review';
import { Reviewer } from '../../domain/value-objects/reviewer.vo';
import { ReviewStatus } from '../../domain/value-objects/review-status.vo';
import {
  ReviewResponseDto,
  ReviewSummaryResponseDto,
} from '../../presentation/dto/review-response.dto';
import { ReviewOrmEntity } from '../persistence/typeorm/review.orm-entity';

export class ReviewMapper {
  static toDomain(ormEntity: ReviewOrmEntity): Review {
    return Review.restore(
      {
        organizationId: OrganizationId.create(ormEntity.organizationId),
        projectId: new UniqueEntityId(ormEntity.projectId),
        deliverableId: ormEntity.deliverableId
          ? new UniqueEntityId(ormEntity.deliverableId)
          : null,
        documentId: ormEntity.documentId
          ? new UniqueEntityId(ormEntity.documentId)
          : null,
        documentVersionId: ormEntity.documentVersionId
          ? new UniqueEntityId(ormEntity.documentVersionId)
          : null,
        requestedBy: ormEntity.requestedBy,
        reviewers: ReviewMapper.reviewersFromOrm(ormEntity),
        status: ReviewStatus.create(ormEntity.status),
        dueDate: ormEntity.dueDate,
        comment: ormEntity.comment,
        reviewedBy: ormEntity.reviewedBy,
        reviewedAt: ormEntity.reviewedAt,
        decisionComment: ormEntity.decisionComment,
      },
      new UniqueEntityId(ormEntity.id),
    );
  }

  static toOrm(review: Review): ReviewOrmEntity {
    const ormEntity = new ReviewOrmEntity();

    ormEntity.id = review.id;
    ormEntity.organizationId = review.organizationId.toString();
    ormEntity.projectId = review.projectId.toString();
    ormEntity.deliverableId = review.deliverableId?.toString() ?? null;
    ormEntity.documentId = review.documentId?.toString() ?? null;
    ormEntity.documentVersionId = review.documentVersionId?.toString() ?? null;
    ormEntity.status = review.status.value;
    ormEntity.requestedBy = review.requestedBy;
    ormEntity.reviewers = review.reviewers.map((reviewer) => reviewer.toJSON());
    ormEntity.reviewedBy = review.reviewedBy;
    ormEntity.reviewedAt = review.reviewedAt;
    ormEntity.dueDate = review.dueDate;
    ormEntity.comment = review.comment;
    ormEntity.decisionComment = review.decisionComment;

    return ormEntity;
  }

  static toSummaryResponse(review: Review): ReviewSummaryResponseDto {
    return {
      id: review.id,
      projectId: review.projectId.toString(),
      deliverableId: review.deliverableId?.toString() ?? null,
      documentId: review.documentId?.toString() ?? null,
      documentVersionId: review.documentVersionId?.toString() ?? null,
      status: review.status.value,
      requestedBy: review.requestedBy,
      reviewers: review.reviewers.map((reviewer) => reviewer.toJSON()),
      reviewedBy: review.reviewedBy,
      reviewedAt: review.reviewedAt?.toISOString() ?? null,
      dueDate: review.dueDate,
      comment: review.comment,
      decisionComment: review.decisionComment,
    };
  }

  static toResponse(review: Review): ReviewResponseDto {
    return ReviewMapper.toSummaryResponse(review);
  }

  static ormToSummaryResponse(
    ormEntity: ReviewOrmEntity,
  ): ReviewSummaryResponseDto {
    return {
      ...ReviewMapper.toSummaryResponse(ReviewMapper.toDomain(ormEntity)),
      updatedAt: ormEntity.updatedAt.toISOString(),
    };
  }

  private static reviewersFromOrm(ormEntity: ReviewOrmEntity): Reviewer[] {
    const reviewers = Array.isArray(ormEntity.reviewers)
      ? ormEntity.reviewers
      : [];

    if (reviewers.length > 0) {
      return reviewers.map((reviewer) =>
        Reviewer.create({
          userId: reviewer.userId,
          role: reviewer.role === 'approver' ? 'approver' : 'reviewer',
        }),
      );
    }

    return [
      Reviewer.create({
        userId: ormEntity.reviewedBy ?? ormEntity.requestedBy,
        role: 'reviewer',
      }),
    ];
  }
}
