import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type {
  Paginated,
  ReviewDetail,
  ReviewSummary,
} from '../../../../shared/contracts/dashboard.contracts';
import { DeliverableOrmEntity } from '../../../deliverables/infrastructure/persistence/typeorm/deliverable.orm-entity';
import { DocumentOrmEntity } from '../../../documents/infrastructure/persistence/typeorm/document.orm-entity';
import { DocumentVersionOrmEntity } from '../../../documents/infrastructure/persistence/typeorm/document-version.orm-entity';
import { UserOrmEntity } from '../../../identity/infrastructure/persistence/typeorm/user.orm-entity';
import { ProjectOrmEntity } from '../../../projects/infrastructure/persistence/typeorm/project.orm-entity';
import { Review } from '../../domain/entities/review';
import {
  type ListReviewsParams,
  type ReviewRepository as ReviewRepositoryPort,
} from '../../domain/repositories/review.repository';
import { ReviewMapper } from '../mappers/review.mapper';
import { ReviewOrmEntity } from '../persistence/typeorm/review.orm-entity';

@Injectable()
export class TypeOrmReviewRepository implements ReviewRepositoryPort {
  constructor(
    @InjectRepository(ReviewOrmEntity)
    private readonly reviews: Repository<ReviewOrmEntity>,
    @InjectRepository(ProjectOrmEntity)
    private readonly projects: Repository<ProjectOrmEntity>,
    @InjectRepository(DeliverableOrmEntity)
    private readonly deliverables: Repository<DeliverableOrmEntity>,
    @InjectRepository(DocumentOrmEntity)
    private readonly documents: Repository<DocumentOrmEntity>,
    @InjectRepository(DocumentVersionOrmEntity)
    private readonly documentVersions: Repository<DocumentVersionOrmEntity>,
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
  ) {}

  async save(review: Review): Promise<void> {
    await this.reviews.save(ReviewMapper.toOrm(review));
  }

  async list(
    organizationId: OrganizationId,
    params: ListReviewsParams,
  ): Promise<Paginated<ReviewSummary>> {
    const query = this.reviews
      .createQueryBuilder('review')
      .where('review.organizationId = :organizationId', {
        organizationId: organizationId.toString(),
      })
      .orderBy('review.dueDate', 'ASC', 'NULLS LAST')
      .addOrderBy('review.updatedAt', 'DESC')
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize);

    if (params.projectId) {
      query.andWhere('review.projectId = :projectId', {
        projectId: params.projectId.toString(),
      });
    }

    if (params.deliverableId) {
      query.andWhere('review.deliverableId = :deliverableId', {
        deliverableId: params.deliverableId.toString(),
      });
    }

    if (params.documentId) {
      query.andWhere('review.documentId = :documentId', {
        documentId: params.documentId.toString(),
      });
    }

    if (params.status) {
      query.andWhere('review.status = :status', { status: params.status });
    }

    const [items, total] = await query.getManyAndCount();

    return {
      items: items.map((item) => ReviewMapper.ormToSummaryResponse(item)),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  async getById(
    reviewId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<ReviewDetail | null> {
    const review = await this.findById(reviewId, organizationId);
    return review ? ReviewMapper.toResponse(review) : null;
  }

  async findById(
    reviewId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<Review | null> {
    const review = await this.reviews.findOne({
      where: {
        id: reviewId.toString(),
        organizationId: organizationId.toString(),
      },
    });

    return review ? ReviewMapper.toDomain(review) : null;
  }

  projectExists(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<boolean> {
    return this.projects.exists({
      where: {
        id: projectId.toString(),
        organizationId: organizationId.toString(),
      },
    });
  }

  deliverableExists(
    deliverableId: UniqueEntityId,
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<boolean> {
    return this.deliverables.exists({
      where: {
        id: deliverableId.toString(),
        projectId: projectId.toString(),
        organizationId: organizationId.toString(),
      },
    });
  }

  documentExists(
    documentId: UniqueEntityId,
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<boolean> {
    return this.documents.exists({
      where: {
        id: documentId.toString(),
        projectId: projectId.toString(),
        organizationId: organizationId.toString(),
      },
    });
  }

  documentVersionExists(
    documentVersionId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<boolean> {
    return this.documentVersions.exists({
      where: {
        id: documentVersionId.toString(),
        organizationId: organizationId.toString(),
      },
    });
  }

  async getMembershipRole(
    userId: string,
    organizationId: OrganizationId,
  ): Promise<string | null> {
    const rows = (await this.reviews.manager.query(
      `
        SELECT role
        FROM memberships
        WHERE user_id = $1
          AND organization_id = $2
        LIMIT 1
      `,
      [userId, organizationId.toString()],
    )) as Array<{ role: string }>;

    return rows[0]?.role ?? null;
  }

  async usersExist(
    userIds: string[],
    organizationId: OrganizationId,
  ): Promise<boolean> {
    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length === 0) {
      return false;
    }

    const count = await this.users.count({
      where: {
        id: In(uniqueUserIds),
        organizationId: organizationId.toString(),
      },
    });

    return count === uniqueUserIds.length;
  }
}
