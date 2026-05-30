import { PublishKnowledgeItemUseCase } from './publish-knowledge-item.use-case';
import type { KnowledgeItemRepository } from '../../domain/repositories/knowledge-item.repository';
import type { DomainEventPublisher } from '../../../../shared/application/ports/domain-event-publisher';
import { KnowledgeItem } from '../../domain/entities/knowledge-item';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { KnowledgeItemType } from '../../domain/value-objects/knowledge-item-type.vo';

describe('PublishKnowledgeItemUseCase', () => {
  it('publishes draft with minimum fields', async () => {
    const item = KnowledgeItem.create({
      organizationId: OrganizationId.new(),
      createdBy: 'user-1',
      title: 'Padrao',
      description: 'desc',
      type: KnowledgeItemType.create('technical_standard'),
      content: { summary: 'ok' },
    });

    const repository = {
      findById: jest.fn().mockResolvedValue(item),
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<KnowledgeItemRepository>;
    const events = { publishAll: jest.fn() } as unknown as jest.Mocked<DomainEventPublisher>;

    const useCase = new PublishKnowledgeItemUseCase(repository, events);
    const result = await useCase.execute({
      organizationId: item.organizationId.toString(),
      itemId: item.id,
      publishedBy: 'admin-1',
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().status).toBe('published');
  });

  it('rejects publication without minimum info', async () => {
    const item = KnowledgeItem.create({
      organizationId: OrganizationId.new(),
      createdBy: 'user-1',
      title: 'Padrao',
      type: KnowledgeItemType.create('technical_standard'),
    });

    const repository = {
      findById: jest.fn().mockResolvedValue(item),
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<KnowledgeItemRepository>;
    const events = { publishAll: jest.fn() } as unknown as jest.Mocked<DomainEventPublisher>;

    const useCase = new PublishKnowledgeItemUseCase(repository, events);
    const result = await useCase.execute({
      organizationId: item.organizationId.toString(),
      itemId: item.id,
      publishedBy: 'admin-1',
    });

    expect(result.isFail()).toBe(true);
  });
});
