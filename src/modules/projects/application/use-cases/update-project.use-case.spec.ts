import { randomUUID } from 'crypto';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type {
  Paginated,
  Project as ProjectContract,
} from '../../../../shared/contracts/dashboard.contracts';
import { Project } from '../../domain/entities/project';
import type { ProjectRepository } from '../../domain/repositories/project.repository';
import { UpdateProjectUseCase } from './update-project.use-case';

class InMemoryProjectRepository implements ProjectRepository {
  project: Project | null = null;
  syncedTags: string[][] = [];

  save(project: Project): Promise<void> {
    this.project = project;
    return Promise.resolve();
  }

  syncTags(params: {
    projectId: UniqueEntityId;
    organizationId: OrganizationId;
    tagIds: string[];
    actorId: string;
  }): Promise<void> {
    this.syncedTags.push(params.tagIds);
    return Promise.resolve();
  }

  ensureSelectableTags(): Promise<void> {
    return Promise.resolve();
  }

  list(): Promise<Paginated<ProjectContract>> {
    return Promise.resolve({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
  }

  getById(): Promise<ProjectContract | null> {
    if (!this.project) return Promise.resolve(null);

    return Promise.resolve({
      id: this.project.id,
      organizationId: this.project.organizationId.toString(),
      name: this.project.name,
      projectType: this.project.projectType,
      status: 'draft',
      progress: 0,
      tagIds: this.syncedTags.at(-1) ?? [],
      tags: [],
    });
  }

  findById(): Promise<Project | null> {
    return Promise.resolve(this.project);
  }

  listTechnicalProfileTagSources(): Promise<[]> {
    return Promise.resolve([]);
  }
}

describe('UpdateProjectUseCase', () => {
  let repository: InMemoryProjectRepository;
  let useCase: UpdateProjectUseCase;
  let organizationId: string;

  beforeEach(() => {
    organizationId = randomUUID();
    repository = new InMemoryProjectRepository();
    repository.project = Project.create({
      organizationId: OrganizationId.create(organizationId),
      name: 'Projeto original',
      projectType: 'projeto tecnico',
    });
    useCase = new UpdateProjectUseCase(repository);
  });

  it('updates project details without touching tags when tagIds is absent', async () => {
    const result = await useCase.execute({
      organizationId,
      projectId: repository.project!.id,
      name: 'Projeto atualizado',
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().name).toBe('Projeto atualizado');
    expect(repository.syncedTags).toEqual([]);
  });

  it('syncs unique tags and allows empty arrays to remove links', async () => {
    const tagId = randomUUID();

    const firstResult = await useCase.execute({
      organizationId,
      projectId: repository.project!.id,
      tagIds: [tagId, tagId],
      updatedBy: 'coord-1',
    });
    const secondResult = await useCase.execute({
      organizationId,
      projectId: repository.project!.id,
      tagIds: [],
      updatedBy: 'coord-1',
    });

    expect(firstResult.isOk()).toBe(true);
    expect(secondResult.isOk()).toBe(true);
    expect(repository.syncedTags).toEqual([[tagId], []]);
  });
});
