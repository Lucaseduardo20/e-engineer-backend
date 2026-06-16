import { randomUUID } from 'crypto';
import { DomainEventPublisher } from '../../../../shared/application/ports/domain-event-publisher';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type {
  Paginated,
  Project as ProjectContract,
} from '../../../../shared/contracts/dashboard.contracts';
import { Project } from '../../domain/entities/project';
import type { ProjectRepository } from '../../domain/repositories/project.repository';
import type { ProjectBaseStructureRepository } from '../ports/project-base-structure.repository';
import { CreateProjectFromBaseProjectUseCase } from './create-project-from-base-project.use-case';

class InMemoryProjectRepository implements ProjectRepository {
  projects: Project[] = [];
  syncedTags: string[][] = [];

  save(project: Project): Promise<void> {
    this.projects.push(project);
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
    return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 20 });
  }

  getById(): Promise<ProjectContract | null> {
    return Promise.resolve(null);
  }

  findById(): Promise<Project | null> {
    return Promise.resolve(null);
  }

  listTechnicalProfileTagSources(): Promise<[]> {
    return Promise.resolve([]);
  }
}

describe('CreateProjectFromBaseProjectUseCase', () => {
  const organizationId = '11111111-1111-4111-8111-111111111111';
  const baseProjectId = '22222222-2222-4222-8222-222222222222';
  const inheritedTagId = '33333333-3333-4333-8333-333333333333';
  const selectedTagId = '44444444-4444-4444-8444-444444444444';
  let projects: InMemoryProjectRepository;
  let baseStructure: jest.Mocked<ProjectBaseStructureRepository>;
  let domainEvents: jest.Mocked<DomainEventPublisher>;
  let useCase: CreateProjectFromBaseProjectUseCase;

  beforeEach(() => {
    projects = new InMemoryProjectRepository();
    baseStructure = {
      recommendByTags: jest.fn(),
      recommendSimilarProjects: jest.fn(),
      baseProjectExists: jest.fn().mockResolvedValue(true),
      listBaseProjectTagIds: jest.fn().mockResolvedValue([inheritedTagId]),
      saveBaseRelation: jest.fn().mockResolvedValue(undefined),
      copyDeliverablesOnly: jest.fn().mockResolvedValue({ deliverablesCopied: 2 }),
      cloneStructure: jest.fn(),
    } as unknown as jest.Mocked<ProjectBaseStructureRepository>;
    domainEvents = {
      publish: jest.fn(),
      publishAll: jest.fn(),
      register: jest.fn(),
    };
    useCase = new CreateProjectFromBaseProjectUseCase(
      projects,
      baseStructure,
      domainEvents,
    );
  });

  it('creates a project from a base, registers origin and inherits tags optionally', async () => {
    const result = await useCase.execute({
      organizationId,
      baseProjectId,
      name: 'Nova UBS',
      client: 'Prefeitura SP',
      projectType: 'UBS',
      tagIds: [selectedTagId],
      inheritTags: true,
      inheritDeliverables: true,
      createdBy: 'coord-1',
    });

    expect(result.isOk()).toBe(true);
    expect(projects.projects).toHaveLength(1);
    expect(projects.syncedTags).toEqual([[inheritedTagId, selectedTagId]]);
    expect(baseStructure.copyDeliverablesOnly).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: expect.objectContaining({ value: organizationId }),
        baseProjectId: expect.objectContaining({ value: baseProjectId }),
        actorId: 'coord-1',
      }),
    );
    expect(baseStructure.cloneStructure).not.toHaveBeenCalled();
    expect(baseStructure.saveBaseRelation).toHaveBeenCalledWith(
      expect.objectContaining({
        inheritTags: true,
        inheritDeliverables: true,
        actorId: 'coord-1',
      }),
    );
    expect(result.unwrap()).toMatchObject({
      name: 'Nova UBS',
      client: 'Prefeitura SP',
      baseProjectId,
      inheritedTags: true,
      inheritedDeliverables: true,
      deliverablesCopied: 2,
    });
  });

  it('rejects base projects outside the tenant', async () => {
    baseStructure.baseProjectExists.mockResolvedValueOnce(false);

    const result = await useCase.execute({
      organizationId,
      baseProjectId: randomUUID(),
      name: 'Nova UBS',
      inheritTags: true,
    });

    expect(result.isFail()).toBe(true);
    expect(result.unwrapError().message).toBe('Base project not found.');
    expect(projects.projects).toHaveLength(0);
  });
});
