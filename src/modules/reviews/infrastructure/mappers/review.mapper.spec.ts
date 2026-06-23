import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Review } from '../../domain/entities/review';
import { Reviewer } from '../../domain/value-objects/reviewer.vo';
import { ReviewMapper } from './review.mapper';

describe('ReviewMapper', () => {
  it('maps domain reviews to persistence and response contracts', () => {
    const review = Review.create({
      organizationId: OrganizationId.create(
        '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      ),
      projectId: new UniqueEntityId('5c6c3c65-3e8a-4f0c-9235-8f65828951f1'),
      requestedBy: 'user-1',
      reviewers: [Reviewer.create('user-2')],
      dueDate: '2026-06-10',
      comment: 'Validar o memorial.',
    });

    expect(ReviewMapper.toOrm(review)).toMatchObject({
      id: review.id,
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      projectId: '5c6c3c65-3e8a-4f0c-9235-8f65828951f1',
      status: 'pending',
      reviewers: [{ userId: 'user-2', role: 'reviewer' }],
    });
    expect(ReviewMapper.toResponse(review)).toMatchObject({
      id: review.id,
      requestedBy: 'user-1',
      reviewers: [{ userId: 'user-2', role: 'reviewer' }],
      comment: 'Validar o memorial.',
    });
  });
});
