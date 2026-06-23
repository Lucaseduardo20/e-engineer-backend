import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { TypeOrmReviewRepository } from './review.repository';

describe('TypeOrmReviewRepository', () => {
  function createRepository() {
    const queryBuilder = {
      addOrderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
    };
    const reviews = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      manager: { query: jest.fn().mockResolvedValue([{ role: 'admin' }]) },
    };
    const repository = new TypeOrmReviewRepository(
      reviews as never,
      { exists: jest.fn() } as never,
      { exists: jest.fn() } as never,
      { exists: jest.fn() } as never,
      { exists: jest.fn() } as never,
      { count: jest.fn() } as never,
    );

    return { queryBuilder, repository, reviews };
  }

  it('applies tenant, entity, status and pagination filters', async () => {
    const { queryBuilder, repository } = createRepository();

    await repository.list(
      OrganizationId.create('7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001'),
      {
        projectId: new UniqueEntityId('5c6c3c65-3e8a-4f0c-9235-8f65828951f1'),
        documentId: new UniqueEntityId('14d03a7b-205c-4bf8-a793-c39862b0a001'),
        page: 3,
        pageSize: 15,
        status: 'pending',
      },
    );

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'review.organizationId = :organizationId',
      { organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'review.projectId = :projectId',
      { projectId: '5c6c3c65-3e8a-4f0c-9235-8f65828951f1' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'review.documentId = :documentId',
      { documentId: '14d03a7b-205c-4bf8-a793-c39862b0a001' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'review.status = :status',
      { status: 'pending' },
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(30);
    expect(queryBuilder.take).toHaveBeenCalledWith(15);
  });

  it('reads membership role for reviewer authorization', async () => {
    const { repository, reviews } = createRepository();

    await expect(
      repository.getMembershipRole(
        'user-1',
        OrganizationId.create('7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001'),
      ),
    ).resolves.toBe('admin');
    expect(reviews.manager.query).toHaveBeenCalled();
  });
});
