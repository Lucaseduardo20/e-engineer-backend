import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type { ReviewComment as ReviewCommentContract } from '../../../../shared/contracts/dashboard.contracts';
import { ReviewComment } from '../../domain/entities/review-comment';
import { ReviewCommentOrmEntity } from '../persistence/typeorm/review-comment.orm-entity';

export class ReviewCommentMapper {
  static toOrm(comment: ReviewComment): ReviewCommentOrmEntity {
    const ormEntity = new ReviewCommentOrmEntity();

    ormEntity.id = comment.id;
    ormEntity.organizationId = comment.organizationId.toString();
    ormEntity.reviewId = comment.reviewId.toString();
    ormEntity.authorUserId = comment.authorUserId;
    ormEntity.body = comment.body;
    ormEntity.createdAt = comment.createdAt;

    return ormEntity;
  }

  static toDomain(ormEntity: ReviewCommentOrmEntity): ReviewComment {
    return ReviewComment.restore(
      {
        organizationId: OrganizationId.create(ormEntity.organizationId),
        reviewId: new UniqueEntityId(ormEntity.reviewId),
        authorUserId: ormEntity.authorUserId,
        body: ormEntity.body,
        createdAt: ormEntity.createdAt,
      },
      new UniqueEntityId(ormEntity.id),
    );
  }

  static toResponse(comment: ReviewComment): ReviewCommentContract {
    return {
      id: comment.id,
      reviewId: comment.reviewId.toString(),
      authorUserId: comment.authorUserId,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  static ormToResponse(ormEntity: ReviewCommentOrmEntity): ReviewCommentContract {
    return ReviewCommentMapper.toResponse(ReviewCommentMapper.toDomain(ormEntity));
  }
}
