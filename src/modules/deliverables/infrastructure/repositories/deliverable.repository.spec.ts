import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { TypeOrmDeliverableRepository } from './deliverable.repository';

describe('TypeOrmDeliverableRepository', () => {
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
    const ormRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const projects = {
      exists: jest.fn().mockResolvedValue(true),
    };
    const deliverableTags = {};
    const technicalTags = {};
    const deliverableBaseRelations = {};
    const deliverableRemovalRequests = {};
    const repository = new TypeOrmDeliverableRepository(
      ormRepository as never,
      projects as never,
      deliverableTags as never,
      technicalTags as never,
      deliverableBaseRelations as never,
      deliverableRemovalRequests as never,
    );

    return { queryBuilder, projects, repository };
  }

  it('applies tenant, project, status and pagination filters', async () => {
    const { queryBuilder, repository } = createRepository();

    await repository.list(
      OrganizationId.create('7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001'),
      {
        projectId: new UniqueEntityId(
          '5c6c3c65-3e8a-4f0c-9235-8f65828951f1',
        ),
        page: 3,
        pageSize: 15,
        status: 'blocked',
      },
    );

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'deliverable.organizationId = :organizationId',
      { organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'deliverable.projectId = :projectId',
      { projectId: '5c6c3c65-3e8a-4f0c-9235-8f65828951f1' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'deliverable.status = :status',
      { status: 'blocked' },
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(30);
    expect(queryBuilder.take).toHaveBeenCalledWith(15);
  });

  it('checks project ownership using the same organization scope', async () => {
    const { projects, repository } = createRepository();

    await repository.projectExists(
      new UniqueEntityId('5c6c3c65-3e8a-4f0c-9235-8f65828951f1'),
      OrganizationId.create('7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001'),
    );

    expect(projects.exists).toHaveBeenCalledWith({
      where: {
        id: '5c6c3c65-3e8a-4f0c-9235-8f65828951f1',
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      },
    });
  });
});
