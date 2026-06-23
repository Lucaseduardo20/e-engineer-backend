import { UnlinkKnowledgeItemUseCase } from './unlink-knowledge-item.use-case';
import type { KnowledgeItemRepository } from '../../domain/repositories/knowledge-item.repository';
import { KnowledgeItem } from '../../domain/entities/knowledge-item';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { KnowledgeItemType } from '../../domain/value-objects/knowledge-item-type.vo';

describe('UnlinkKnowledgeItemUseCase', () => {
  it('removes relation from item scoped by tenant', async () => {
    const item = KnowledgeItem.create({
      organizationId: OrganizationId.new(),
      createdBy: 'user-1',
      title: 'Padrao',
      type: KnowledgeItemType.create('technical_standard'),
    });

    const repository = {
      findById: jest.fn().mockResolvedValue(item),
      removeRelation: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<KnowledgeItemRepository>;

    const useCase = new UnlinkKnowledgeItemUseCase(repository);

    const result = await useCase.execute({
      organizationId: item.organizationId.toString(),
      itemId: item.id,
      relationId: '7a9b4b7f-f6fb-45c6-a31e-86dc817b08cd',
    });

    expect(result.isOk()).toBe(true);
    expect(repository.removeRelation).toHaveBeenCalledTimes(1);
  });
});
