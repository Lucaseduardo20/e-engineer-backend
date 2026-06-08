import { OrganizationId } from '../../../../../shared/domain/value-objects/organization-id';
import { TypeOrmProjectRepository } from './typeorm-project.repository';
import type { ProjectOrmEntity } from './project.orm-entity';

describe('TypeOrmProjectRepository', () => {
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
    const repository = new TypeOrmProjectRepository(ormRepository as never);

    return { queryBuilder, ormRepository, repository };
  }

  it('applies tenant, pagination, name and status filters', async () => {
    const { queryBuilder, repository } = createRepository();

    await repository.list(
      OrganizationId.create('7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001'),
      {
        page: 3,
        pageSize: 15,
        name: 'ponte',
        status: 'active',
      },
    );

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'project.organizationId = :organizationId',
      { organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'project.name ILIKE :name',
      { name: '%ponte%' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'project.status IN (:...statuses)',
      { statuses: ['active', 'in_progress', 'in_review', 'overdue'] },
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(30);
    expect(queryBuilder.take).toHaveBeenCalledWith(15);
  });

  it('maps orm rows to project contracts', async () => {
    const { queryBuilder, repository } = createRepository();
    queryBuilder.getManyAndCount.mockResolvedValue([
      [
        {
          id: 'project-1',
          name: 'Ponte Norte',
          client: 'Prefeitura',
          projectType: 'Obra de arte especial',
          responsibleName: 'Lucas Eduardo',
          status: 'waiting_approval',
          organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
          tags: ['infra'],
        } satisfies Partial<ProjectOrmEntity>,
      ],
      1,
    ]);

    const result = await repository.list(
      OrganizationId.create('7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001'),
      {
        page: 1,
        pageSize: 10,
      },
    );

    expect(result).toEqual({
      items: [
        {
          id: 'project-1',
          name: 'Ponte Norte',
          description: 'Prefeitura',
          client: 'Prefeitura',
          projectType: 'Obra de arte especial',
          responsibleName: 'Lucas Eduardo',
          status: 'paused',
          organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
          progress: 78,
          tags: ['infra'],
          metrics: { tags: 1 },
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    });
  });
});
