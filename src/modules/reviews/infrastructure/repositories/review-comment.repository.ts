import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type { ReviewComment as ReviewCommentContract } from '../../../../shared/contracts/dashboard.contracts';
import { ReviewComment } from '../../domain/entities/review-comment';
import type { ReviewCommentRepository as ReviewCommentRepositoryPort } from '../../domain/repositories/review-comment.repository';
import { ReviewCommentMapper } from '../mappers/review-comment.mapper';
import { ReviewCommentOrmEntity } from '../persistence/typeorm/review-comment.orm-entity';

@Injectable()
export class TypeOrmReviewCommentRepository implements ReviewCommentRepositoryPort {
  constructor(
    @InjectRepository(ReviewCommentOrmEntity)
    private readonly comments: Repository<ReviewCommentOrmEntity>,
  ) {}

  async save(comment: ReviewComment): Promise<void> {
    await this.comments.save(ReviewCommentMapper.toOrm(comment));
  }

  async listByReview(
    reviewId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<ReviewCommentContract[]> {
    const comments = await this.comments.find({
      where: {
        reviewId: reviewId.toString(),
        organizationId: organizationId.toString(),
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return comments.map((comment) => ReviewCommentMapper.ormToResponse(comment));
  }
}
