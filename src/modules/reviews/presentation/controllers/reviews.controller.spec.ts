import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import { AuditQueryService } from '../../../audit/infrastructure/repositories/audit-query.service';
import { ApproveReviewUseCase } from '../../application/use-cases/approve-review.use-case';
import { AddReviewCommentUseCase } from '../../application/use-cases/add-review-comment.use-case';
import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case';
import { GetReviewUseCase } from '../../application/use-cases/get-review.use-case';
import { ListReviewsUseCase } from '../../application/use-cases/list-reviews.use-case';
import { RejectReviewUseCase } from '../../application/use-cases/reject-review.use-case';
import { RegisterReviewAsLessonLearnedUseCase } from '../../application/use-cases/register-review-as-lesson-learned.use-case';
import { ReviewsController } from './reviews.controller';

function createRequest(): AuthenticatedRequest {
  return {
    user: {
      userId: 'user-1',
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
    },
  } as AuthenticatedRequest;
}

function reviewResponse(status = 'pending') {
  return {
    id: 'review-1',
    projectId: 'project-1',
    deliverableId: null,
    documentId: null,
    documentVersionId: null,
    status,
    requestedBy: 'user-1',
    reviewers: [{ userId: 'user-2', role: 'reviewer' }],
    reviewedBy: null,
    reviewedAt: null,
    dueDate: null,
    comment: 'Revisar documento.',
    decisionComment: null,
  };
}

describe('ReviewsController', () => {
  let createReviewUseCase: jest.Mocked<CreateReviewUseCase>;
  let listReviewsUseCase: jest.Mocked<ListReviewsUseCase>;
  let getReviewUseCase: jest.Mocked<GetReviewUseCase>;
  let approveReviewUseCase: jest.Mocked<ApproveReviewUseCase>;
  let rejectReviewUseCase: jest.Mocked<RejectReviewUseCase>;
  let addReviewCommentUseCase: jest.Mocked<AddReviewCommentUseCase>;
  let registerReviewAsLessonLearnedUseCase: jest.Mocked<RegisterReviewAsLessonLearnedUseCase>;
  let audit: jest.Mocked<AuditQueryService>;
  let controller: ReviewsController;

  beforeEach(() => {
    createReviewUseCase = { execute: jest.fn() } as never;
    listReviewsUseCase = { execute: jest.fn() } as never;
    getReviewUseCase = { execute: jest.fn() } as never;
    approveReviewUseCase = { execute: jest.fn() } as never;
    rejectReviewUseCase = { execute: jest.fn() } as never;
    addReviewCommentUseCase = { execute: jest.fn() } as never;
    registerReviewAsLessonLearnedUseCase = { execute: jest.fn() } as never;
    audit = { record: jest.fn() } as never;
    controller = new ReviewsController(
      createReviewUseCase,
      listReviewsUseCase,
      getReviewUseCase,
      approveReviewUseCase,
      rejectReviewUseCase,
      addReviewCommentUseCase,
      registerReviewAsLessonLearnedUseCase,
      audit,
    );
  });

  it('lists reviews using the authenticated organization', async () => {
    listReviewsUseCase.execute.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    });

    await controller.list(
      {
        page: 1,
        pageSize: 10,
        projectId: 'project-1',
        status: 'pending',
      },
      createRequest(),
    );

    expect(listReviewsUseCase.execute).toHaveBeenCalledWith({
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      projectId: 'project-1',
      deliverableId: undefined,
      documentId: undefined,
      page: 1,
      pageSize: 10,
      status: 'pending',
    });
  });

  it('creates reviews without accepting organizationId or requestedBy from body', async () => {
    createReviewUseCase.execute.mockResolvedValue(Result.ok(reviewResponse()));

    await controller.create(
      {
        projectId: 'project-1',
        reviewers: ['user-2'],
        comment: 'Revisar documento.',
      },
      createRequest(),
    );

    expect(createReviewUseCase.execute).toHaveBeenCalledWith({
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      requestedBy: 'user-1',
      projectId: 'project-1',
      reviewers: ['user-2'],
      comment: 'Revisar documento.',
    });
  });

  it('maps missing details to not found', async () => {
    getReviewUseCase.execute.mockResolvedValue(null);

    await expect(
      controller.detail('missing', createRequest()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('approves reviews and records audit events', async () => {
    approveReviewUseCase.execute.mockResolvedValue(
      Result.ok(reviewResponse('approved')),
    );

    await controller.approve(
      'review-1',
      { comment: 'Aprovado.' },
      createRequest(),
    );

    expect(approveReviewUseCase.execute).toHaveBeenCalledWith({
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      reviewId: 'review-1',
      actorUserId: 'user-1',
      comment: 'Aprovado.',
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'review.approved',
        entityId: 'review-1',
      }),
    );
  });

  it('maps unauthorized decisions to forbidden', async () => {
    rejectReviewUseCase.execute.mockResolvedValue(
      Result.fail(new Error('User is not authorized to decide this review.')),
    );

    await expect(
      controller.reject('review-1', {}, createRequest()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('maps failed creation to bad request', async () => {
    createReviewUseCase.execute.mockResolvedValue(
      Result.fail(new Error('Review must have at least one reviewer.')),
    );

    await expect(
      controller.create(
        { projectId: 'project-1', reviewers: [], comment: 'Revisar.' },
        createRequest(),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('adds comments to reviews and records audit events', async () => {
    addReviewCommentUseCase.execute.mockResolvedValue(
      Result.ok({
        id: 'comment-1',
        reviewId: 'review-1',
        authorUserId: 'user-1',
        body: 'Detalhei a pendencia tecnica.',
        createdAt: '2026-05-28T10:00:00.000Z',
      }),
    );

    await expect(
      controller.addComment(
        'review-1',
        { body: 'Detalhei a pendencia tecnica.' },
        createRequest(),
      ),
    ).resolves.toEqual({
      data: {
        id: 'comment-1',
        reviewId: 'review-1',
        authorUserId: 'user-1',
        body: 'Detalhei a pendencia tecnica.',
        createdAt: '2026-05-28T10:00:00.000Z',
      },
    });
    expect(addReviewCommentUseCase.execute).toHaveBeenCalledWith({
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      reviewId: 'review-1',
      actorUserId: 'user-1',
      body: 'Detalhei a pendencia tecnica.',
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'review.comment.created',
        entityId: 'review-1',
      }),
    );
  });
});
