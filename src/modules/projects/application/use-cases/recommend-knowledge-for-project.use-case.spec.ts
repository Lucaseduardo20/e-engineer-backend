import { RecommendKnowledgeForProjectUseCase } from './recommend-knowledge-for-project.use-case';
import type { DeliverableRepository } from '../../../deliverables/domain/repositories/deliverable.repository';
import type { KnowledgeItemRepository } from '../../../knowledge-base/domain/repositories/knowledge-item.repository';
import type { ProjectRepository } from '../../domain/repositories/project.repository';

describe('RecommendKnowledgeForProjectUseCase', () => {
  const organizationId = '11111111-1111-4111-8111-111111111111';
  const projectId = '22222222-2222-4222-8222-222222222222';
  const deliverableId = '33333333-3333-4333-8333-333333333333';
  const tagId = '44444444-4444-4444-8444-444444444444';
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

  function makeUseCase(overrides?: {
    projects?: Partial<jest.Mocked<ProjectRepository>>;
    deliverables?: Partial<jest.Mocked<DeliverableRepository>>;
    knowledgeItems?: Partial<jest.Mocked<KnowledgeItemRepository>>;
  }) {
    const projects = {
      getById: jest.fn().mockResolvedValue(project),
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
        tags: [tag],
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
      ),
      projects,
      deliverables,
      knowledgeItems,
    };
  }

  it('recommends published knowledge that matches active deliverable tags', async () => {
    const { useCase, knowledgeItems } = makeUseCase();

    const result = await useCase.execute({ organizationId, projectId });

    expect(result?.items).toHaveLength(1);
    expect(result?.items[0]).toMatchObject({
      score: 13,
      matchedTags: [tag],
      knowledgeItem: {
        id: knowledgeItemId,
        title: 'Checklist de orcamento',
      },
    });
    expect(knowledgeItems.list).toHaveBeenCalledWith(
      expect.objectContaining({ value: organizationId }),
      expect.objectContaining({
        status: 'published',
        tagIds: [tagId],
      }),
    );
  });

  it('does not recommend knowledge already applied to the project context', async () => {
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
          tags: [tag],
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

    expect(result).toEqual({ items: [] });
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
