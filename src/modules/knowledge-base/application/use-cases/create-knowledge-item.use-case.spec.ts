import { CreateKnowledgeItemUseCase } from './create-knowledge-item.use-case';
import type { DomainEventPublisher } from '../../../../shared/application/ports/domain-event-publisher';
import type { KnowledgeItemRepository } from '../../domain/repositories/knowledge-item.repository';

describe('CreateKnowledgeItemUseCase', () => {
  const repository = {
    save: jest.fn(),
  } as unknown as jest.Mocked<KnowledgeItemRepository>;
  const events = {
    publishAll: jest.fn(),
  } as unknown as jest.Mocked<DomainEventPublisher>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a valid draft item', async () => {
    const useCase = new CreateKnowledgeItemUseCase(repository, events);

    const result = await useCase.execute({
      organizationId: '11111111-1111-4111-8111-111111111111',
      createdBy: 'user-1',
      title: 'Padrao tecnico',
      type: 'technical_standard',
      tags: ['Revisao'],
    });

    expect(result.isOk()).toBe(true);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(events.publishAll).toHaveBeenCalledTimes(1);
    expect(result.unwrap().status).toBe('draft');
    expect(result.unwrap().tags).toEqual(['revisao']);
  });

  it('fails for invalid payload', async () => {
    const useCase = new CreateKnowledgeItemUseCase(repository, events);

    const result = await useCase.execute({
      organizationId: '11111111-1111-4111-8111-111111111111',
      createdBy: 'user-1',
      title: '',
      type: 'technical_standard',
    });

    expect(result.isFail()).toBe(true);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
