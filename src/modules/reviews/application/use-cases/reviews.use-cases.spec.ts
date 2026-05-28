import { randomUUID } from 'crypto';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Review } from '../../domain/entities/review';
import { ReviewCommentRepository } from '../../domain/repositories/review-comment.repository';
import { ReviewRepository } from '../../domain/repositories/review.repository';
import { Reviewer } from '../../domain/value-objects/reviewer.vo';
import { CreateReviewUseCase } from './create-review.use-case';
import { ApproveReviewUseCase } from './approve-review.use-case';
import { RejectReviewUseCase } from './reject-review.use-case';
import { ListReviewsUseCase } from './list-reviews.use-case';
import { AddReviewCommentUseCase } from './add-review-comment.use-case';

function createRepository(): jest.Mocked<ReviewRepository> {
  return {
    deliverableExists: jest.fn(),
    documentExists: jest.fn(),
    documentVersionExists: jest.fn(),
    findById: jest.fn(),
    getById: jest.fn(),
    getMembershipRole: jest.fn(),
    list: jest.fn(),
    projectExists: jest.fn(),
    save: jest.fn(),
    usersExist: jest.fn(),
  };
}

function createCommentRepository(): jest.Mocked<ReviewCommentRepository> {
  return {
    listByReview: jest.fn(),
    save: jest.fn(),
  };
}

describe('Reviews use cases', () => {
  it('creates a review scoped to the authenticated organization', async () => {
    const repository = createRepository();
    repository.projectExists.mockResolvedValue(true);
    repository.usersExist.mockResolvedValue(true);
    const useCase = new CreateReviewUseCase(repository);
    const organizationId = randomUUID();
    const projectId = randomUUID();
    const reviewerId = randomUUID();

    const result = await useCase.execute({
      organizationId,
      projectId,
      requestedBy: 'requester-1',
      reviewers: [reviewerId, reviewerId],
      dueDate: '2026-06-10',
      comment: 'Validar memoria de calculo estrutural.',
    });

    expect(result.isOk()).toBe(true);
    expect(repository.projectExists).toHaveBeenCalledWith(
      new UniqueEntityId(projectId),
      OrganizationId.create(organizationId),
    );
    expect(repository.usersExist).toHaveBeenCalledWith(
      [reviewerId],
      OrganizationId.create(organizationId),
    );
    expect(repository.save).toHaveBeenCalledWith(expect.any(Review));
    expect(result.unwrap()).toMatchObject({
      projectId,
      requestedBy: 'requester-1',
      status: 'pending',
      reviewers: [{ userId: reviewerId }],
    });
  });

  it('rejects review creation when project does not belong to tenant', async () => {
    const repository = createRepository();
    repository.projectExists.mockResolvedValue(false);
    const useCase = new CreateReviewUseCase(repository);

    const result = await useCase.execute({
      organizationId: randomUUID(),
      projectId: randomUUID(),
      requestedBy: 'requester-1',
      reviewers: [randomUUID()],
      comment: 'Revisar laudo.',
    });

    expect(result.isFail()).toBe(true);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('normalizes full ISO review due dates to the stored date value', async () => {
    const repository = createRepository();
    repository.projectExists.mockResolvedValue(true);
    repository.usersExist.mockResolvedValue(true);
    const useCase = new CreateReviewUseCase(repository);
    const reviewerId = randomUUID();

    const result = await useCase.execute({
      organizationId: randomUUID(),
      projectId: randomUUID(),
      requestedBy: 'requester-1',
      reviewers: [reviewerId],
      dueDate: '2026-06-10T03:00:00.000Z',
      comment: 'Validar memorial.',
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().dueDate).toBe('2026-06-10');
  });

  it('lists reviews with tenant and entity filters', async () => {
    const repository = createRepository();
    repository.list.mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      pageSize: 10,
    });
    const useCase = new ListReviewsUseCase(repository);
    const organizationId = randomUUID();
    const projectId = randomUUID();
    const documentId = randomUUID();

    await useCase.execute({
      organizationId,
      projectId,
      documentId,
      status: 'pending',
      page: 2,
      pageSize: 10,
    });

    expect(repository.list).toHaveBeenCalledWith(
      OrganizationId.create(organizationId),
      {
        projectId: new UniqueEntityId(projectId),
        deliverableId: undefined,
        documentId: new UniqueEntityId(documentId),
        page: 2,
        pageSize: 10,
        status: 'pending',
      },
    );
  });

  it('allows listed reviewers to approve and blocks unrelated members', async () => {
    const repository = createRepository();
    const reviewerId = randomUUID();
    const review = Review.create({
      organizationId: OrganizationId.create(randomUUID()),
      projectId: new UniqueEntityId(),
      requestedBy: 'requester-1',
      reviewers: [Reviewer.create(reviewerId)],
      comment: 'Revisar orçamento.',
    });
    repository.findById.mockResolvedValue(review);
    repository.getMembershipRole.mockResolvedValue('member');
    const approve = new ApproveReviewUseCase(repository);

    const result = await approve.execute({
      organizationId: review.organizationId.toString(),
      reviewId: review.id,
      actorUserId: reviewerId,
      comment: 'Aprovado.',
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().status).toBe('approved');
    expect(repository.save).toHaveBeenCalledWith(review);

    const unrelatedReview = Review.create({
      organizationId: review.organizationId,
      projectId: new UniqueEntityId(),
      requestedBy: 'requester-1',
      reviewers: [Reviewer.create(randomUUID())],
      comment: 'Revisar laudo.',
    });
    repository.findById.mockResolvedValue(unrelatedReview);
    const reject = new RejectReviewUseCase(repository);
    const blocked = await reject.execute({
      organizationId: unrelatedReview.organizationId.toString(),
      reviewId: unrelatedReview.id,
      actorUserId: randomUUID(),
    });

    expect(blocked.isFail()).toBe(true);
  });

  it('allows involved users to comment on reviews', async () => {
    const repository = createRepository();
    const commentRepository = createCommentRepository();
    const reviewerId = randomUUID();
    const review = Review.create({
      organizationId: OrganizationId.create(randomUUID()),
      projectId: new UniqueEntityId(),
      requestedBy: 'requester-1',
      reviewers: [Reviewer.create(reviewerId)],
      comment: 'Revisar memorial.',
    });
    repository.findById.mockResolvedValue(review);
    repository.getMembershipRole.mockResolvedValue('member');
    const useCase = new AddReviewCommentUseCase(repository, commentRepository);

    const result = await useCase.execute({
      organizationId: review.organizationId.toString(),
      reviewId: review.id,
      actorUserId: reviewerId,
      body: 'Conferi a memoria de calculo e deixei uma observacao.',
    });

    expect(result.isOk()).toBe(true);
    expect(commentRepository.save).toHaveBeenCalled();
    expect(result.unwrap()).toMatchObject({
      reviewId: review.id,
      authorUserId: reviewerId,
      body: 'Conferi a memoria de calculo e deixei uma observacao.',
    });
  });

  it('blocks unrelated users from commenting on reviews', async () => {
    const repository = createRepository();
    const commentRepository = createCommentRepository();
    const review = Review.create({
      organizationId: OrganizationId.create(randomUUID()),
      projectId: new UniqueEntityId(),
      requestedBy: 'requester-1',
      reviewers: [Reviewer.create(randomUUID())],
      comment: 'Revisar memorial.',
    });
    repository.findById.mockResolvedValue(review);
    repository.getMembershipRole.mockResolvedValue('member');
    const useCase = new AddReviewCommentUseCase(repository, commentRepository);

    const result = await useCase.execute({
      organizationId: review.organizationId.toString(),
      reviewId: review.id,
      actorUserId: randomUUID(),
      body: 'Tentativa de comentario.',
    });

    expect(result.isFail()).toBe(true);
    expect(commentRepository.save).not.toHaveBeenCalled();
  });
});
