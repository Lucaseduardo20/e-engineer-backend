import { LinkKnowledgeItemToProjectUseCase } from './link-knowledge-item-to-project.use-case';
import { ListProjectKnowledgeItemsUseCase } from './list-project-knowledge-items.use-case';
import { UnlinkKnowledgeItemFromProjectUseCase } from './unlink-knowledge-item-from-project.use-case';
import type { ProjectRepository } from '../../domain/repositories/project.repository';
import type { KnowledgeItemRepository } from '../../../knowledge-base/domain/repositories/knowledge-item.repository';
import type { DeliverableRepository } from '../../../deliverables/domain/repositories/deliverable.repository';
import type { AuditQueryService } from '../../../audit/infrastructure/repositories/audit-query.service';

describe('Project knowledge deliverable relations', () => {
  const organizationId = '11111111-1111-4111-8111-111111111111';
  const projectId = '22222222-2222-4222-8222-222222222222';
  const deliverableId = '33333333-3333-4333-8333-333333333333';
  const knowledgeItemId = '44444444-4444-4444-8444-444444444444';

  const projectRepository = {
    getById: jest.fn().mockResolvedValue({
      id: projectId,
      organizationId,
      name: 'UBS Vila Esperança',
      status: 'active',
      progress: 45,
    }),
  } as unknown as jest.Mocked<ProjectRepository>;

  const deliverableRepository = {
    getById: jest.fn().mockResolvedValue({
      id: deliverableId,
      projectId,
      title: 'Orçamento',
      status: 'in_progress',
      assignees: [],
    }),
    list: jest.fn().mockResolvedValue({
      items: [{ id: deliverableId, projectId, title: 'Orçamento' }],
      total: 1,
      page: 1,
      pageSize: 500,
    }),
  } as unknown as jest.Mocked<DeliverableRepository>;

  const knowledgeRepository = {
    findById: jest.fn().mockResolvedValue({
      id: knowledgeItemId,
      title: 'Checklist de orçamento',
      status: { value: 'published' },
    }),
    findByIdWithRelations: jest.fn().mockResolvedValue({
      id: knowledgeItemId,
      title: 'Checklist de orçamento',
      description: 'Checklist aplicável ao orçamento.',
      type: 'checklist',
      status: 'published',
      tags: [],
      updatedAt: '2026-06-09T12:00:00.000Z',
      relations: [],
    }),
    list: jest.fn().mockResolvedValue({
      items: [{ id: knowledgeItemId }],
      total: 1,
      page: 1,
      pageSize: 100,
    }),
    saveRelation: jest.fn().mockResolvedValue(undefined),
    removeRelation: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<KnowledgeItemRepository>;

  const audit = {
    record: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditQueryService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('links a knowledge item directly to a deliverable in the project', async () => {
    const useCase = new LinkKnowledgeItemToProjectUseCase(
      projectRepository,
      knowledgeRepository,
      deliverableRepository,
      audit,
    );

    const result = await useCase.execute({
      organizationId,
      projectId,
      knowledgeItemId,
      deliverableId,
      relationType: 'checklist_for',
      linkedBy: 'coord-1',
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toMatchObject({
      targetType: 'deliverable',
      targetId: deliverableId,
      relationType: 'checklist_for',
    });
    expect(knowledgeRepository.saveRelation).toHaveBeenCalledTimes(1);
  });

  it('rejects deliverables from another project', async () => {
    deliverableRepository.getById.mockResolvedValueOnce({
      id: deliverableId,
      projectId: '99999999-9999-4999-8999-999999999999',
      title: 'Orçamento',
      status: 'in_progress',
      assignees: [],
    } as never);
    const useCase = new LinkKnowledgeItemToProjectUseCase(
      projectRepository,
      knowledgeRepository,
      deliverableRepository,
      audit,
    );

    const result = await useCase.execute({
      organizationId,
      projectId,
      knowledgeItemId,
      deliverableId,
      relationType: 'checklist_for',
      linkedBy: 'coord-1',
    });

    expect(result.isFail()).toBe(true);
    expect(result.unwrapError().message).toBe('Deliverable not found for this project.');
    expect(knowledgeRepository.saveRelation).not.toHaveBeenCalled();
  });

  it('lists knowledge relations applied to project deliverables', async () => {
    knowledgeRepository.findByIdWithRelations.mockResolvedValueOnce({
      id: knowledgeItemId,
      title: 'Checklist de orçamento',
      description: 'Checklist aplicável ao orçamento.',
      type: 'checklist',
      status: 'published',
      tags: [],
      updatedAt: '2026-06-09T12:00:00.000Z',
      relations: [
        {
          id: '55555555-5555-4555-8555-555555555555',
          organizationId,
          knowledgeItemId,
          targetType: 'deliverable',
          targetId: deliverableId,
          relationType: 'checklist_for',
          createdBy: 'coord-1',
          createdAt: '2026-06-09T12:00:00.000Z',
        },
      ],
    } as never);
    const useCase = new ListProjectKnowledgeItemsUseCase(
      projectRepository,
      knowledgeRepository,
      deliverableRepository,
    );

    const result = await useCase.execute({ organizationId, projectId });

    expect(result?.items).toHaveLength(1);
    expect(result?.items[0]).toMatchObject({
      targetType: 'deliverable',
      targetId: deliverableId,
      relationType: 'checklist_for',
    });
  });

  it('removes knowledge relations from project deliverables', async () => {
    const relationId = '55555555-5555-4555-8555-555555555555';
    knowledgeRepository.findByIdWithRelations.mockResolvedValueOnce({
      relations: [
        {
          id: relationId,
          targetType: 'deliverable',
          targetId: deliverableId,
        },
      ],
    } as never);
    const useCase = new UnlinkKnowledgeItemFromProjectUseCase(
      projectRepository,
      knowledgeRepository,
      deliverableRepository,
      audit,
    );

    const result = await useCase.execute({
      organizationId,
      projectId,
      relationId,
    });

    expect(result.isOk()).toBe(true);
    expect(knowledgeRepository.removeRelation).toHaveBeenCalledWith(
      expect.objectContaining({
        relationId: expect.objectContaining({ value: relationId }),
        knowledgeItemId: expect.objectContaining({ value: knowledgeItemId }),
      }),
    );
  });
});
