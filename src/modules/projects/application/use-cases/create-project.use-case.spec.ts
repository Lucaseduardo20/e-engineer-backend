import { randomUUID } from 'crypto';
import { DomainEventPublisher } from '../../../../shared/application/ports/domain-event-publisher';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type {
  Paginated,
  Project as ProjectContract,
} from '../../../../shared/contracts/dashboard.contracts';
import { Project } from '../../domain/entities/project';
import { ProjectRepository } from '../../domain/repositories/project.repository';
import type { ProjectBaseStructureRepository } from '../ports/project-base-structure.repository';
import { CreateProjectUseCase } from './create-project.use-case';

class InMemoryProjectRepository implements ProjectRepository {
  readonly projects: Project[] = [];
  readonly syncedTags: string[][] = [];

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

  findById(): Promise<Project | null> {
    return Promise.resolve(null);
  }

  list(): Promise<Paginated<ProjectContract>> {
    return Promise.resolve({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
  }

  getById(
    _projectId: UniqueEntityId,
    _organizationId: OrganizationId,
  ): Promise<ProjectContract | null> {
    return Promise.resolve(null);
  }

  listTechnicalProfileTagSources(): Promise<[]> {
    return Promise.resolve([]);
  }
}

describe('CreateProjectUseCase', () => {
  let projectRepository: InMemoryProjectRepository;
  let domainEventPublisher: jest.Mocked<DomainEventPublisher>;
  let projectBaseStructure: jest.Mocked<ProjectBaseStructureRepository>;
  let useCase: CreateProjectUseCase;

  beforeEach(() => {
    projectRepository = new InMemoryProjectRepository();
    domainEventPublisher = {
      publish: jest.fn(),
      publishAll: jest.fn(),
      register: jest.fn(),
    };
    projectBaseStructure = {
      recommendByTags: jest.fn(),
      recommendSimilarProjects: jest.fn(),
      baseProjectExists: jest.fn().mockResolvedValue(true),
      listBaseProjectTagIds: jest.fn().mockResolvedValue([]),
      ensureDeliverablesBelongToBase: jest.fn().mockResolvedValue(undefined),
      saveBaseRelation: jest.fn().mockResolvedValue(undefined),
      copyDeliverablesOnly: jest.fn().mockResolvedValue({
        deliverablesCopied: 0,
      }),
      cloneStructure: jest.fn().mockResolvedValue({
        deliverablesCopied: 0,
        documentsCopied: 0,
        documentVersionsCopied: 0,
        reviewsCopied: 0,
      }),
    };
    useCase = new CreateProjectUseCase(
      projectRepository,
      domainEventPublisher,
      projectBaseStructure,
    );
  });

  it('creates a technical engineering project scoped by organization', async () => {
    const organizationId = randomUUID();

    const result = await useCase.execute({
      organizationId,
      name: 'Reforma de Escola Municipal',
      projectType: 'reforma escolar',
    });

    expect(result.isOk()).toBe(true);
    expect(projectRepository.projects).toHaveLength(1);
    const publishedEvents = domainEventPublisher.publishAll.mock.calls[0][0];

    expect(publishedEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventName: 'ProjectCreated',
          organizationId,
        }),
      ]),
    );
    expect(result.unwrap()).toMatchObject({
      organizationId,
      name: 'Reforma de Escola Municipal',
      projectType: 'reforma escolar',
      status: 'draft',
    });
    expect(projectBaseStructure.cloneStructure).not.toHaveBeenCalled();
  });

  it('creates a project from a base without copying documents or reviews', async () => {
    const organizationId = randomUUID();
    const baseProjectId = randomUUID();
    projectBaseStructure.copyDeliverablesOnly.mockResolvedValueOnce({
      deliverablesCopied: 3,
    });

    const result = await useCase.execute({
      organizationId,
      name: 'UBS Nova',
      projectType: 'unidade de saude',
      baseProjectId,
      createdBy: 'coord-1',
    });

    expect(result.isOk()).toBe(true);
    expect(projectBaseStructure.copyDeliverablesOnly).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: expect.objectContaining({ value: organizationId }),
        baseProjectId: expect.objectContaining({ value: baseProjectId }),
        targetProjectId: expect.any(UniqueEntityId),
        actorId: 'coord-1',
      }),
    );
    expect(projectBaseStructure.cloneStructure).not.toHaveBeenCalled();
    expect(projectBaseStructure.saveBaseRelation).toHaveBeenCalledWith(
      expect.objectContaining({
        inheritTags: false,
        inheritDeliverables: true,
        actorId: 'coord-1',
      }),
    );
    expect(result.unwrap()).toMatchObject({
      clonedFromProjectId: baseProjectId,
      clonedStructure: {
        deliverablesCopied: 3,
        documentsCopied: 0,
        documentVersionsCopied: 0,
        reviewsCopied: 0,
      },
    });
  });

  it('validates and syncs unique technical tags when creating a project', async () => {
    const organizationId = randomUUID();
    const tagId = randomUUID();
    const ensureSelectableTags = jest.spyOn(
      projectRepository,
      'ensureSelectableTags',
    );

    const result = await useCase.execute({
      organizationId,
      name: 'UBS Nova',
      projectType: 'unidade de saude',
      tagIds: [tagId, tagId],
      createdBy: 'coord-1',
    });

    expect(result.isOk()).toBe(true);
    expect(ensureSelectableTags).toHaveBeenCalledWith({
      organizationId: expect.objectContaining({ value: organizationId }),
      tagIds: [tagId],
    });
    expect(projectRepository.syncedTags).toEqual([[tagId]]);
    expect(result.unwrap().tagIds).toEqual([tagId]);
  });

  it('rejects projects without a technical project name', async () => {
    const result = await useCase.execute({
      organizationId: randomUUID(),
      name: '   ',
      projectType: 'drenagem',
    });

    expect(result.isFail()).toBe(true);
    expect(result.unwrapError().message).toBe('Project name is required');
    expect(projectRepository.projects).toHaveLength(0);
  });
});
