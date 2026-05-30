import { DeprecateKnowledgeItemUseCase } from './deprecate-knowledge-item.use-case';
import type { KnowledgeItemRepository } from '../../domain/repositories/knowledge-item.repository';
import type { DomainEventPublisher } from '../../../../shared/application/ports/domain-event-publisher';
import { KnowledgeItem } from '../../domain/entities/knowledge-item';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { KnowledgeItemType } from '../../domain/value-objects/knowledge-item-type.vo';

describe('DeprecateKnowledgeItemUseCase', () => {
  it('deprecates a published item', async () => {
    const item = KnowledgeItem.create({
      organizationId: OrganizationId.new(),
      createdBy: 'user-1',
      title: 'Padrao',
      type: KnowledgeItemType.create('technical_standard'),
      description: 'desc',
      content: { summary: 'ok' },
    });
    item.publish('admin-1');

    const repository = {
      findById: jest.fn().mockResolvedValue(item),
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<KnowledgeItemRepository>;
    const events = { publishAll: jest.fn() } as unknown as jest.Mocked<DomainEventPublisher>;

    const useCase = new DeprecateKnowledgeItemUseCase(repository, events);
    const result = await useCase.execute({
      organizationId: item.organizationId.toString(),
      itemId: item.id,
      deprecatedBy: 'admin-1',
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().status).toBe('deprecated');
    expect(result.unwrap().deprecatedAt).toBeTruthy();
  });
});
