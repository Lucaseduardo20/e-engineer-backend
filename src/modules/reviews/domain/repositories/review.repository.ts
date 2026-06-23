import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type {
  Paginated,
  ReviewDetail,
  ReviewSummary,
} from '../../../../shared/contracts/dashboard.contracts';
import { Review } from '../entities/review';

export const REVIEW_REPOSITORY = Symbol('REVIEW_REPOSITORY');

export interface ListReviewsParams {
  page: number;
  pageSize: number;
  projectId?: UniqueEntityId;
  deliverableId?: UniqueEntityId;
  documentId?: UniqueEntityId;
  status?: string;
}

export interface ReviewRepository {
  save(review: Review): Promise<void>;
  list(
    organizationId: OrganizationId,
    params: ListReviewsParams,
  ): Promise<Paginated<ReviewSummary>>;
  getById(
    reviewId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<ReviewDetail | null>;
  findById(
    reviewId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<Review | null>;
  projectExists(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<boolean>;
  deliverableExists(
    deliverableId: UniqueEntityId,
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<boolean>;
  documentExists(
    documentId: UniqueEntityId,
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<boolean>;
  documentVersionExists(
    documentVersionId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<boolean>;
  getMembershipRole(
    userId: string,
    organizationId: OrganizationId,
  ): Promise<string | null>;
  usersExist(
    userIds: string[],
    organizationId: OrganizationId,
  ): Promise<boolean>;
}
