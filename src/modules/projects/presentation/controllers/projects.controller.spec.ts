import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import { AuditQueryService } from '../../../audit/infrastructure/repositories/audit-query.service';
import { CreateProjectFromBaseProjectUseCase } from '../../application/use-cases/create-project-from-base-project.use-case';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import { GetProjectDetailUseCase } from '../../application/use-cases/get-project-detail.use-case';
import { GetProjectTechnicalProfileUseCase } from '../../application/use-cases/get-project-technical-profile.use-case';
import { ListProjectsUseCase } from '../../application/use-cases/list-projects.use-case';
import { UpdateProjectUseCase } from '../../application/use-cases/update-project.use-case';
import { UpdateProjectStatusUseCase } from '../../application/use-cases/update-project-status.use-case';
import { ListProjectKnowledgeItemsUseCase } from '../../application/use-cases/list-project-knowledge-items.use-case';
import { LinkKnowledgeItemToProjectUseCase } from '../../application/use-cases/link-knowledge-item-to-project.use-case';
import { UnlinkKnowledgeItemFromProjectUseCase } from '../../application/use-cases/unlink-knowledge-item-from-project.use-case';
import { RecommendKnowledgeForProjectUseCase } from '../../application/use-cases/recommend-knowledge-for-project.use-case';
import { RecommendProjectBasesByTagsUseCase } from '../../application/use-cases/recommend-project-bases-by-tags.use-case';
import { RecommendSimilarProjectsUseCase } from '../../application/use-cases/recommend-similar-projects.use-case';
import { ProjectsController } from './projects.controller';

function createRequest(): AuthenticatedRequest {
  return {
    user: {
      userId: 'user-1',
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
    },
  } as AuthenticatedRequest;
}

describe('ProjectsController', () => {
  let createProjectUseCase: jest.Mocked<CreateProjectUseCase>;
  let createProjectFromBaseProjectUseCase: jest.Mocked<CreateProjectFromBaseProjectUseCase>;
  let listProjectsUseCase: jest.Mocked<ListProjectsUseCase>;
  let getProjectDetailUseCase: jest.Mocked<GetProjectDetailUseCase>;
  let getProjectTechnicalProfileUseCase: jest.Mocked<GetProjectTechnicalProfileUseCase>;
  let updateProjectUseCase: jest.Mocked<UpdateProjectUseCase>;
  let updateProjectStatusUseCase: jest.Mocked<UpdateProjectStatusUseCase>;
  let listProjectKnowledgeItemsUseCase: jest.Mocked<ListProjectKnowledgeItemsUseCase>;
  let linkKnowledgeItemToProjectUseCase: jest.Mocked<LinkKnowledgeItemToProjectUseCase>;
  let unlinkKnowledgeItemFromProjectUseCase: jest.Mocked<UnlinkKnowledgeItemFromProjectUseCase>;
  let recommendKnowledgeForProjectUseCase: jest.Mocked<RecommendKnowledgeForProjectUseCase>;
  let recommendProjectBasesByTagsUseCase: jest.Mocked<RecommendProjectBasesByTagsUseCase>;
  let recommendSimilarProjectsUseCase: jest.Mocked<RecommendSimilarProjectsUseCase>;
  let audit: jest.Mocked<AuditQueryService>;
  let controller: ProjectsController;

  beforeEach(() => {
    createProjectUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateProjectUseCase>;
    createProjectFromBaseProjectUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateProjectFromBaseProjectUseCase>;
    listProjectsUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListProjectsUseCase>;
    getProjectDetailUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetProjectDetailUseCase>;
    getProjectTechnicalProfileUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetProjectTechnicalProfileUseCase>;
    updateProjectUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateProjectUseCase>;
    updateProjectStatusUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateProjectStatusUseCase>;
    listProjectKnowledgeItemsUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListProjectKnowledgeItemsUseCase>;
    linkKnowledgeItemToProjectUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<LinkKnowledgeItemToProjectUseCase>;
    unlinkKnowledgeItemFromProjectUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UnlinkKnowledgeItemFromProjectUseCase>;
    recommendKnowledgeForProjectUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RecommendKnowledgeForProjectUseCase>;
    recommendProjectBasesByTagsUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RecommendProjectBasesByTagsUseCase>;
    recommendSimilarProjectsUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RecommendSimilarProjectsUseCase>;
    audit = {
      record: jest.fn(),
    } as unknown as jest.Mocked<AuditQueryService>;
    controller = new ProjectsController(
      createProjectUseCase,
      createProjectFromBaseProjectUseCase,
      listProjectsUseCase,
      getProjectDetailUseCase,
      getProjectTechnicalProfileUseCase,
      updateProjectUseCase,
      updateProjectStatusUseCase,
      audit,
      listProjectKnowledgeItemsUseCase,
      linkKnowledgeItemToProjectUseCase,
      unlinkKnowledgeItemFromProjectUseCase,
      recommendKnowledgeForProjectUseCase,
      recommendProjectBasesByTagsUseCase,
      recommendSimilarProjectsUseCase,
    );
  });

  it('lists projects using tenant and filters from query', async () => {
    listProjectsUseCase.execute.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    });

    await expect(
      controller.list(
        { page: 1, pageSize: 10, name: 'ponte', status: 'active' },
        createRequest(),
      ),
    ).resolves.toEqual({
      data: { items: [], total: 0, page: 1, pageSize: 10 },
    });
    expect(listProjectsUseCase.execute).toHaveBeenCalledWith({
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      page: 1,
      pageSize: 10,
      name: 'ponte',
      status: 'active',
    });
  });

  it('returns project details when found', async () => {
    getProjectDetailUseCase.execute.mockResolvedValue({
      id: 'project-1',
      name: 'Ponte Norte',
      status: 'active',
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      progress: 35,
    });

    await expect(
      controller.detail('project-1', createRequest()),
    ).resolves.toEqual({
      data: {
        id: 'project-1',
        name: 'Ponte Norte',
        status: 'active',
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
        progress: 35,
      },
    });
  });

  it('recommends project bases using tenant and selected tags', async () => {
    recommendProjectBasesByTagsUseCase.execute.mockResolvedValue({ items: [] });

    await expect(
      controller.recommendBases(
        { tagIds: ['44444444-4444-4444-8444-444444444444'] },
        createRequest(),
      ),
    ).resolves.toEqual({ data: { items: [] } });

    expect(recommendProjectBasesByTagsUseCase.execute).toHaveBeenCalledWith({
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      tagIds: ['44444444-4444-4444-8444-444444444444'],
      limit: undefined,
    });
  });

  it('recommends similar projects using tenant and selected tags', async () => {
    recommendSimilarProjectsUseCase.execute.mockResolvedValue({
      items: [
        {
          project: {
            id: 'project-1',
            name: 'UBS Vila Esperanca',
            status: 'completed',
            progress: 0,
          },
          matchedTags: [
            {
              id: '44444444-4444-4444-8444-444444444444',
              name: 'UBS',
              slug: 'ubs',
              category: 'project_type',
              status: 'active',
            },
          ],
          reason: 'Combina com UBS.',
          counters: {
            matchedTags: 1,
            deliverables: 4,
            documents: 2,
            reviews: 1,
          },
          score: 10,
        },
      ],
    });

    await expect(
      controller.similar(
        {
          tagIds: ['44444444-4444-4444-8444-444444444444'],
          limit: 6,
        },
        createRequest(),
      ),
    ).resolves.toEqual({
      data: {
        items: [
          {
            project: {
              id: 'project-1',
              name: 'UBS Vila Esperanca',
              status: 'completed',
              progress: 0,
            },
            matchedTags: [
              {
                id: '44444444-4444-4444-8444-444444444444',
                name: 'UBS',
                slug: 'ubs',
                category: 'project_type',
                status: 'active',
              },
            ],
            reason: 'Combina com UBS.',
            counters: {
              matchedTags: 1,
              deliverables: 4,
              documents: 2,
              reviews: 1,
            },
            score: 10,
          },
        ],
      },
    });
    expect(recommendSimilarProjectsUseCase.execute).toHaveBeenCalledWith({
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      tagIds: ['44444444-4444-4444-8444-444444444444'],
      limit: 6,
    });
  });

  it('maps missing project details to not found', async () => {
    getProjectDetailUseCase.execute.mockResolvedValue(null);

    await expect(
      controller.detail('project-1', createRequest()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the project technical profile using the active tenant', async () => {
    getProjectTechnicalProfileUseCase.execute.mockResolvedValue({
      projectId: 'project-1',
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      scoreExplanation: 'Tag direta no projeto: +3.',
      tags: [
        {
          id: '44444444-4444-4444-8444-444444444444',
          name: 'UBS',
          slug: 'ubs',
          category: 'project_type',
          status: 'active',
          score: 3,
          sources: [{ type: 'project_tag', score: 3 }],
        },
      ],
    });

    await expect(
      controller.technicalProfile('project-1', createRequest()),
    ).resolves.toEqual({
      data: {
        projectId: 'project-1',
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
        scoreExplanation: 'Tag direta no projeto: +3.',
        tags: [
          {
            id: '44444444-4444-4444-8444-444444444444',
            name: 'UBS',
            slug: 'ubs',
            category: 'project_type',
            status: 'active',
            score: 3,
            sources: [{ type: 'project_tag', score: 3 }],
          },
        ],
      },
    });
    expect(getProjectTechnicalProfileUseCase.execute).toHaveBeenCalledWith({
      projectId: 'project-1',
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
    });
  });

  it('creates projects and records audit entries', async () => {
    createProjectUseCase.execute.mockResolvedValue(
      Result.ok({
        id: 'project-1',
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
        name: 'Ponte Norte',
        projectType: 'estrutural',
        status: 'draft',
      }),
    );

    await expect(
      controller.create(
        { name: 'Ponte Norte', projectType: 'estrutural' },
        createRequest(),
      ),
    ).resolves.toEqual({
      data: {
        id: 'project-1',
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
        name: 'Ponte Norte',
        projectType: 'estrutural',
        status: 'draft',
      },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
        action: 'project.created',
        entityId: 'project-1',
      }),
    );
  });

  it('maps failed creation to bad request', async () => {
    createProjectUseCase.execute.mockResolvedValue(
      Result.fail(new Error('Project name is required')),
    );

    await expect(
      controller.create(
        { name: '', projectType: 'estrutural' },
        createRequest(),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates projects from a base project and records origin audit', async () => {
    createProjectFromBaseProjectUseCase.execute.mockResolvedValue(
      Result.ok({
        id: 'project-2',
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
        name: 'Nova UBS',
        projectType: 'UBS',
        status: 'draft',
        client: 'Prefeitura SP',
        baseProjectId: 'project-1',
        inheritedTags: true,
        inheritedDeliverables: false,
        tagIds: ['44444444-4444-4444-8444-444444444444'],
        deliverablesCopied: 0,
      }),
    );

    await expect(
      controller.createFromBase(
        {
          baseProjectId: 'project-1',
          name: 'Nova UBS',
          client: 'Prefeitura SP',
          tagIds: ['44444444-4444-4444-8444-444444444444'],
          inheritTags: true,
          inheritDeliverables: false,
        },
        createRequest(),
      ),
    ).resolves.toEqual({
      data: {
        id: 'project-2',
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
        name: 'Nova UBS',
        projectType: 'UBS',
        status: 'draft',
        client: 'Prefeitura SP',
        baseProjectId: 'project-1',
        inheritedTags: true,
        inheritedDeliverables: false,
        tagIds: ['44444444-4444-4444-8444-444444444444'],
        deliverablesCopied: 0,
      },
    });
    expect(createProjectFromBaseProjectUseCase.execute).toHaveBeenCalledWith({
      baseProjectId: 'project-1',
      name: 'Nova UBS',
      client: 'Prefeitura SP',
      tagIds: ['44444444-4444-4444-8444-444444444444'],
      inheritTags: true,
      inheritDeliverables: false,
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      createdBy: 'user-1',
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'project.created_from_base',
        entityId: 'project-2',
        metadata: expect.objectContaining({ baseProjectId: 'project-1' }),
      }),
    );
  });

  it('updates project status and records audit entries', async () => {
    updateProjectStatusUseCase.execute.mockResolvedValue(
      Result.ok({
        id: 'project-1',
        name: 'Ponte Norte',
        status: 'paused',
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
        progress: 20,
      }),
    );

    await expect(
      controller.updateStatus(
        'project-1',
        { status: 'paused' },
        createRequest(),
      ),
    ).resolves.toEqual({
      data: {
        id: 'project-1',
        name: 'Ponte Norte',
        status: 'paused',
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
        progress: 20,
      },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'project.status.updated',
        entityId: 'project-1',
      }),
    );
  });

  it('updates project tags and records audit entries', async () => {
    updateProjectUseCase.execute.mockResolvedValue(
      Result.ok({
        id: 'project-1',
        name: 'Ponte Norte',
        status: 'active',
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
        progress: 35,
        tagIds: ['44444444-4444-4444-8444-444444444444'],
        tags: [
          {
            id: '44444444-4444-4444-8444-444444444444',
            name: 'Drenagem',
            slug: 'drenagem',
            category: 'project_type',
            status: 'active',
          },
        ],
      }),
    );

    await expect(
      controller.update(
        'project-1',
        { tagIds: ['44444444-4444-4444-8444-444444444444'] },
        createRequest(),
      ),
    ).resolves.toEqual({
      data: {
        id: 'project-1',
        name: 'Ponte Norte',
        status: 'active',
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
        progress: 35,
        tagIds: ['44444444-4444-4444-8444-444444444444'],
        tags: [
          {
            id: '44444444-4444-4444-8444-444444444444',
            name: 'Drenagem',
            slug: 'drenagem',
            category: 'project_type',
            status: 'active',
          },
        ],
      },
    });
    expect(updateProjectUseCase.execute).toHaveBeenCalledWith({
      projectId: 'project-1',
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      name: undefined,
      projectType: undefined,
      tagIds: ['44444444-4444-4444-8444-444444444444'],
      updatedBy: 'user-1',
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'project.updated',
        entityId: 'project-1',
        metadata: {
          name: 'Ponte Norte',
          tagIds: ['44444444-4444-4444-8444-444444444444'],
        },
      }),
    );
  });
});
