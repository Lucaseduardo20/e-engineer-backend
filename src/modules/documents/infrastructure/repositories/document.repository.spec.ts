import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { TypeOrmDocumentRepository } from './document.repository';

describe('TypeOrmDocumentRepository', () => {
  function createRepository() {
    const queryBuilder = {
      addOrderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
    };
    const documents = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const versions = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const projects = { exists: jest.fn().mockResolvedValue(true) };
    const deliverables = { exists: jest.fn().mockResolvedValue(true) };
    const documentTags = {};
    const technicalTags = {};
    const repository = new TypeOrmDocumentRepository(
      documents as never,
      versions as never,
      projects as never,
      deliverables as never,
      documentTags as never,
      technicalTags as never,
    );

    return { deliverables, projects, queryBuilder, repository };
  }

  it('applies tenant, project, status, type and pagination filters', async () => {
    const { queryBuilder, repository } = createRepository();

    await repository.list(
      OrganizationId.create('7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001'),
      {
        projectId: new UniqueEntityId('5c6c3c65-3e8a-4f0c-9235-8f65828951f1'),
        page: 3,
        pageSize: 15,
        status: 'approved',
        type: 'laudo',
      },
    );

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'document.organizationId = :organizationId',
      { organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'document.projectId = :projectId',
      { projectId: '5c6c3c65-3e8a-4f0c-9235-8f65828951f1' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'document.status = :status',
      { status: 'approved' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'document.type = :type',
      {
        type: 'laudo',
      },
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(30);
    expect(queryBuilder.take).toHaveBeenCalledWith(15);
  });

  it('checks deliverable ownership using project and organization scope', async () => {
    const { deliverables, repository } = createRepository();

    await repository.deliverableExists(
      new UniqueEntityId('14d03a7b-205c-4bf8-a793-c39862b0a001'),
      new UniqueEntityId('5c6c3c65-3e8a-4f0c-9235-8f65828951f1'),
      OrganizationId.create('7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001'),
    );

    expect(deliverables.exists).toHaveBeenCalledWith({
      where: {
        id: '14d03a7b-205c-4bf8-a793-c39862b0a001',
        projectId: '5c6c3c65-3e8a-4f0c-9235-8f65828951f1',
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      },
    });
  });
});
