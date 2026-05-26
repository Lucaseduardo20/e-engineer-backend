import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { ProjectRepository } from '../../domain/repositories/project.repository';
import { ListProjectsUseCase } from './list-projects.use-case';

describe('ListProjectsUseCase', () => {
  it('delegates listing with tenant scope and pagination', async () => {
    const repository: Pick<ProjectRepository, 'list'> = {
      list: jest.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 2,
        pageSize: 10,
      }),
    };
    const useCase = new ListProjectsUseCase(repository as ProjectRepository);

    await expect(
      useCase.execute({
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
        page: 2,
        pageSize: 10,
      }),
    ).resolves.toEqual({ items: [], total: 0, page: 2, pageSize: 10 });

    expect(repository.list).toHaveBeenCalledWith(
      OrganizationId.create('7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001'),
      { page: 2, pageSize: 10 },
    );
  });
});
