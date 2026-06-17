import { randomUUID } from 'crypto';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type {
  Paginated,
  Project as ProjectContract,
} from '../../../../shared/contracts/dashboard.contracts';
import { Project } from '../../domain/entities/project';
import type {
  ProjectRepository,
  ProjectTechnicalProfileTagSource,
} from '../../domain/repositories/project.repository';
import { ProjectTechnicalProfileScoreService } from '../services/project-technical-profile-score.service';
import { GetProjectTechnicalProfileUseCase } from './get-project-technical-profile.use-case';

class InMemoryProjectRepository implements ProjectRepository {
  project: Project | null = null;
  tagSources: ProjectTechnicalProfileTagSource[] = [];

  save(project: Project): Promise<void> {
    this.project = project;
    return Promise.resolve();
  }

  syncTags(): Promise<void> {
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

  findById(
    _projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<Project | null> {
    if (!this.project) return Promise.resolve(null);
    if (this.project.organizationId.toString() !== organizationId.toString()) {
      return Promise.resolve(null);
    }

    return Promise.resolve(this.project);
  }

  listTechnicalProfileTagSources(): Promise<ProjectTechnicalProfileTagSource[]> {
    return Promise.resolve(
      this.tagSources.filter((tagSource) => tagSource.status !== 'archived'),
    );
  }
}

describe('GetProjectTechnicalProfileUseCase', () => {
  let repository: InMemoryProjectRepository;
  let useCase: GetProjectTechnicalProfileUseCase;
  let organizationId: string;

  beforeEach(() => {
    organizationId = randomUUID();
    repository = new InMemoryProjectRepository();
    repository.project = Project.create({
      organizationId: OrganizationId.create(organizationId),
      name: 'UBS Vila Esperanca',
      projectType: 'UBS',
    });
    useCase = new GetProjectTechnicalProfileUseCase(
      repository,
      new ProjectTechnicalProfileScoreService(),
    );
  });

  it('returns direct project tags with deterministic score and source', async () => {
    const tagId = randomUUID();
    repository.tagSources = [
      {
        tagId,
        name: 'UBS',
        slug: 'ubs',
        category: 'project_type',
        status: 'active',
        source: 'manual',
      },
    ];

    const result = await useCase.execute({
      organizationId,
      projectId: repository.project!.id,
    });

    expect(result).toMatchObject({
      projectId: repository.project!.id,
      organizationId,
      scoreExplanation:
        'Tag direta no projeto: +3. Tag em entregavel: +2. Tag em documento: +1. Documento oficial: +3.',
      tags: [
        {
          id: tagId,
          name: 'UBS',
          score: 3,
          sources: [{ type: 'project_tag', score: 3 }],
        },
      ],
    });
  });

  it('adds deliverable tags with lower score to the technical profile', async () => {
    const tagId = randomUUID();
    repository.tagSources = [
      {
        tagId,
        name: 'Orcamento',
        slug: 'orcamento',
        category: 'technical_discipline',
        status: 'active',
        source: 'deliverable_tag',
      },
    ];

    const result = await useCase.execute({
      organizationId,
      projectId: repository.project!.id,
    });

    expect(result?.tags).toEqual([
      expect.objectContaining({
        id: tagId,
        score: 2,
        sources: [{ type: 'deliverable_tag', score: 2 }],
      }),
    ]);
  });

  it('scores document tags and official document tags in the technical profile', async () => {
    const documentTagId = randomUUID();
    const officialTagId = randomUUID();
    repository.tagSources = [
      {
        tagId: documentTagId,
        name: 'Memorial descritivo',
        slug: 'memorial-descritivo',
        category: 'document_type',
        status: 'active',
        source: 'document_tag',
      },
      {
        tagId: officialTagId,
        name: 'Projeto executivo',
        slug: 'projeto-executivo',
        category: 'project_stage',
        status: 'active',
        source: 'official_document',
      },
    ];

    const result = await useCase.execute({
      organizationId,
      projectId: repository.project!.id,
    });

    expect(result?.tags).toEqual([
      expect.objectContaining({
        id: officialTagId,
        score: 3,
        sources: [{ type: 'official_document', score: 3 }],
      }),
      expect.objectContaining({
        id: documentTagId,
        score: 1,
        sources: [{ type: 'document_tag', score: 1 }],
      }),
    ]);
  });

  it('returns an empty profile for projects without tags', async () => {
    const result = await useCase.execute({
      organizationId,
      projectId: repository.project!.id,
    });

    expect(result?.tags).toEqual([]);
  });

  it('omits archived tags from the profile', async () => {
    repository.tagSources = [
      {
        tagId: randomUUID(),
        name: 'Obsoleta',
        slug: 'obsoleta',
        category: 'project_type',
        status: 'archived',
        source: 'manual',
      },
    ];

    const result = await useCase.execute({
      organizationId,
      projectId: repository.project!.id,
    });

    expect(result?.tags).toEqual([]);
  });

  it('returns null when project is outside the current tenant', async () => {
    const result = await useCase.execute({
      organizationId: randomUUID(),
      projectId: repository.project!.id,
    });

    expect(result).toBeNull();
  });
});
