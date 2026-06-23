import { RecommendKnowledgeForProjectUseCase } from './recommend-knowledge-for-project.use-case';
import type { DeliverableRepository } from '../../../deliverables/domain/repositories/deliverable.repository';
import type { KnowledgeItemRepository } from '../../../knowledge-base/domain/repositories/knowledge-item.repository';
import type { ProjectRepository } from '../../domain/repositories/project.repository';
import { ProjectTechnicalProfileScoreService } from '../services/project-technical-profile-score.service';

describe('RecommendKnowledgeForProjectUseCase', () => {
  const organizationId = '11111111-1111-4111-8111-111111111111';
  const projectId = '22222222-2222-4222-8222-222222222222';
  const deliverableId = '33333333-3333-4333-8333-333333333333';
  const tagId = '44444444-4444-4444-8444-444444444444';
  const projectTagId = '66666666-6666-4666-8666-666666666666';
  const knowledgeItemId = '55555555-5555-4555-8555-555555555555';

  const project = {
    id: projectId,
    organizationId,
    name: 'UBS Vila Esperanca',
    status: 'active' as const,
    progress: 45,
  };
  const tag = {
    id: tagId,
    name: 'Orcamento',
    slug: 'orcamento',
    category: 'document_type',
    status: 'active',
  };
  const projectTag = {
    id: projectTagId,
    name: 'UBS',
    slug: 'ubs',
    category: 'project_type',
    status: 'active',
  };

  function makeUseCase(overrides?: {
    projects?: Partial<jest.Mocked<ProjectRepository>>;
    deliverables?: Partial<jest.Mocked<DeliverableRepository>>;
    knowledgeItems?: Partial<jest.Mocked<KnowledgeItemRepository>>;
  }) {
    const projects = {
      getById: jest.fn().mockResolvedValue(project),
      listTechnicalProfileTagSources: jest.fn().mockResolvedValue([
        {
          tagId: projectTag.id,
          name: projectTag.name,
          slug: projectTag.slug,
          category: projectTag.category,
          status: projectTag.status,
          source: 'project_tag',
        },
        {
          tagId: tag.id,
          name: tag.name,
          slug: tag.slug,
          category: tag.category,
          status: tag.status,
          source: 'deliverable_tag',
        },
      ]),
      ...overrides?.projects,
    } as unknown as jest.Mocked<ProjectRepository>;
    const deliverables = {
      list: jest.fn().mockResolvedValue({
        items: [
          {
            id: deliverableId,
            tags: [tag],
          },
        ],
        total: 1,
        page: 1,
        pageSize: 500,
      }),
      ...overrides?.deliverables,
    } as unknown as jest.Mocked<DeliverableRepository>;
    const knowledgeItems = {
      list: jest.fn().mockResolvedValue({
        items: [{ id: knowledgeItemId }],
        total: 1,
        page: 1,
        pageSize: 100,
      }),
      findByIdWithRelations: jest.fn().mockResolvedValue({
        id: knowledgeItemId,
        organizationId,
        title: 'Checklist de orcamento',
        description: 'Padrao para revisar orcamentos de UBS.',
        type: 'review_checklist',
        status: 'published',
        visibility: 'organization',
        tags: [tag, projectTag],
        createdBy: 'user-1',
        updatedBy: 'user-1',
        publishedAt: '2026-06-01T00:00:00.000Z',
        archivedAt: null,
        deprecatedAt: null,
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-02T00:00:00.000Z',
        relations: [],
        attachments: [],
      }),
      ...overrides?.knowledgeItems,
    } as unknown as jest.Mocked<KnowledgeItemRepository>;

    return {
      useCase: new RecommendKnowledgeForProjectUseCase(
        projects,
        deliverables,
        knowledgeItems,
        new ProjectTechnicalProfileScoreService(),
      ),
      projects,
      deliverables,
      knowledgeItems,
    };
  }

  it('recommends published knowledge using weighted project technical profile tags', async () => {
    const { useCase, knowledgeItems } = makeUseCase();

    const result = await useCase.execute({ organizationId, projectId });

    expect(result?.items).toHaveLength(1);
    expect(result?.items[0]).toMatchObject({
      type: 'review_checklist',
      score: 12,
      matchedTags: [projectTag, tag],
      alreadyApplied: false,
      knowledgeItem: {
        id: knowledgeItemId,
        title: 'Checklist de orcamento',
      },
    });
    expect(knowledgeItems.list).toHaveBeenCalledWith(
      expect.objectContaining({ value: organizationId }),
      expect.objectContaining({
        status: 'published',
        tagIds: [projectTagId, tagId],
      }),
    );
  });

  it('keeps already applied knowledge marked and with lower score', async () => {
    const { useCase } = makeUseCase({
      knowledgeItems: {
        findByIdWithRelations: jest.fn().mockResolvedValue({
          id: knowledgeItemId,
          organizationId,
          title: 'Checklist de orcamento',
          description: null,
          type: 'review_checklist',
          status: 'published',
          visibility: 'organization',
          tags: [tag, projectTag],
          createdBy: 'user-1',
          updatedBy: 'user-1',
          publishedAt: '2026-06-01T00:00:00.000Z',
          archivedAt: null,
          deprecatedAt: null,
          createdAt: '2026-06-01T00:00:00.000Z',
          updatedAt: '2026-06-02T00:00:00.000Z',
          relations: [
            {
              id: 'relation-1',
              organizationId,
              knowledgeItemId,
              targetType: 'deliverable',
              targetId: deliverableId,
              relationType: 'reference_for',
              createdBy: 'user-1',
              createdAt: '2026-06-02T00:00:00.000Z',
            },
          ],
          attachments: [],
        }),
      },
    });

    const result = await useCase.execute({ organizationId, projectId });

    expect(result?.items).toHaveLength(1);
    expect(result?.items[0]).toMatchObject({
      alreadyApplied: true,
      score: 7,
    });
    expect(result?.items[0].reason).toContain('Ja esta aplicado');
  });

  it('excludes archived knowledge and signals deprecated recommendations', async () => {
    const deprecatedId = '77777777-7777-4777-8777-777777777777';
    const { useCase } = makeUseCase({
      knowledgeItems: {
        list: jest
          .fn()
          .mockResolvedValueOnce({
            items: [{ id: knowledgeItemId }],
            total: 1,
            page: 1,
            pageSize: 100,
          })
          .mockResolvedValueOnce({
            items: [{ id: deprecatedId }],
            total: 1,
            page: 1,
            pageSize: 40,
          }),
        findByIdWithRelations: jest
          .fn()
          .mockResolvedValueOnce({
            id: knowledgeItemId,
            organizationId,
            title: 'Arquivado',
            description: null,
            type: 'review_checklist',
            status: 'archived',
            tags: [tag],
            updatedAt: '2026-06-02T00:00:00.000Z',
            publishedAt: '2026-06-01T00:00:00.000Z',
            archivedAt: '2026-06-03T00:00:00.000Z',
            deprecatedAt: null,
            relations: [],
          })
          .mockResolvedValueOnce({
            id: deprecatedId,
            organizationId,
            title: 'Checklist antigo',
            description: null,
            type: 'review_checklist',
            status: 'deprecated',
            tags: [tag],
            updatedAt: '2026-06-02T00:00:00.000Z',
            publishedAt: '2026-06-01T00:00:00.000Z',
            archivedAt: null,
            deprecatedAt: '2026-06-03T00:00:00.000Z',
            relations: [],
          }),
      },
    });

    const result = await useCase.execute({ organizationId, projectId });

    expect(result?.items).toHaveLength(1);
    expect(result?.items[0]).toMatchObject({
      knowledgeItem: { id: deprecatedId },
      score: 1,
      alreadyApplied: false,
    });
    expect(result?.items[0].reason).toContain('depreciado');
  });

  it('returns null when the project does not exist in the tenant scope', async () => {
    const { useCase, deliverables, knowledgeItems } = makeUseCase({
      projects: {
        getById: jest.fn().mockResolvedValue(null),
      },
    });

    const result = await useCase.execute({ organizationId, projectId });

    expect(result).toBeNull();
    expect(deliverables.list).not.toHaveBeenCalled();
    expect(knowledgeItems.list).not.toHaveBeenCalled();
  });
});
