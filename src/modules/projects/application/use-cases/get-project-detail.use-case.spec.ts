import { randomUUID } from 'crypto';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { ProjectRepository } from '../../domain/repositories/project.repository';
import { GetProjectDetailUseCase } from './get-project-detail.use-case';

describe('GetProjectDetailUseCase', () => {
  it('loads project details scoped by organization', async () => {
    const projectId = randomUUID();
    const organizationId = randomUUID();
    const project = {
      id: projectId,
      name: 'Ponte Norte',
      status: 'active' as const,
      organizationId,
      progress: 35,
    };
    const repository: Pick<ProjectRepository, 'getById'> = {
      getById: jest.fn().mockResolvedValue(project),
    };
    const useCase = new GetProjectDetailUseCase(
      repository as ProjectRepository,
    );

    await expect(useCase.execute({ projectId, organizationId })).resolves.toBe(
      project,
    );
    expect(repository.getById).toHaveBeenCalledWith(
      new UniqueEntityId(projectId),
      OrganizationId.create(organizationId),
    );
  });
});
