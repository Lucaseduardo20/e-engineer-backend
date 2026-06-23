import { PromoteProjectToKnowledgeUseCase } from './promote-project-to-knowledge.use-case';
import type { DomainEventPublisher } from '../../../../shared/application/ports/domain-event-publisher';
import type { KnowledgeItemRepository } from '../../domain/repositories/knowledge-item.repository';
import type { AuditQueryService } from '../../../audit/infrastructure/repositories/audit-query.service';

describe('PromoteProjectToKnowledgeUseCase', () => {
  const organizationId = '11111111-1111-4111-8111-111111111111';
  const projectId = '22222222-2222-4222-8222-222222222222';

  const makeRepository = () =>
    ({
      targetExists: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(undefined),
      saveRelation: jest.fn().mockResolvedValue(undefined),
      syncTags: jest.fn().mockResolvedValue(undefined),
    }) as unknown as jest.Mocked<KnowledgeItemRepository>;

  const events = {
    publishAll: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<DomainEventPublisher>;

  const audit = {
    record: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditQueryService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('promotes a project and syncs selected technical tags', async () => {
    const repository = makeRepository();
    const useCase = new PromoteProjectToKnowledgeUseCase(repository, events, audit);
    const tagIds = [
      '33333333-3333-4333-8333-333333333333',
      '44444444-4444-4444-8444-444444444444',
      '33333333-3333-4333-8333-333333333333',
    ];

    const result = await useCase.execute({
      organizationId,
      projectId,
      createdBy: 'admin-1',
      title: 'Praça Domingos de Ferreira',
      description: 'Referência criada a partir do projeto.',
      tagIds,
      reason: 'Decisão técnica reutilizável.',
      whenToUse: 'Projetos similares.',
      warnings: 'Validar premissas locais.',
    });

    expect(result.isOk()).toBe(true);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.syncTags).toHaveBeenCalledWith({
      knowledgeItemId: expect.anything(),
      organizationId: expect.objectContaining({
        value: organizationId,
      }),
      tagIds: [
        '33333333-3333-4333-8333-333333333333',
        '44444444-4444-4444-8444-444444444444',
      ],
      actorId: 'admin-1',
    });
    expect(repository.saveRelation).toHaveBeenCalledTimes(1);
  });
});
