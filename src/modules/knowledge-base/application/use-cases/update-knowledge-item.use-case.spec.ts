import { UpdateKnowledgeItemUseCase } from './update-knowledge-item.use-case';
import type { KnowledgeItemRepository } from '../../domain/repositories/knowledge-item.repository';
import { KnowledgeItem } from '../../domain/entities/knowledge-item';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { KnowledgeItemType } from '../../domain/value-objects/knowledge-item-type.vo';

describe('UpdateKnowledgeItemUseCase', () => {
  it('updates a valid knowledge item and keeps tenant scope', async () => {
    const item = KnowledgeItem.create({
      organizationId: OrganizationId.create('11111111-1111-4111-8111-111111111111'),
      createdBy: 'user-1',
      title: 'Padrao inicial',
      type: KnowledgeItemType.create('technical_standard'),
      tags: ['padrao'],
    });

    const repository = {
      findById: jest.fn().mockResolvedValue(item),
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<KnowledgeItemRepository>;

    const useCase = new UpdateKnowledgeItemUseCase(repository);

    const result = await useCase.execute({
      organizationId: '11111111-1111-4111-8111-111111111111',
      itemId: item.id,
      updatedBy: 'admin-1',
      title: 'Padrao atualizado',
      type: 'document_model',
      tags: ['Padrao', 'padrao'],
    });

    expect(result.isOk()).toBe(true);
    expect(repository.findById).toHaveBeenCalledWith(expect.anything(), expect.anything());
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(result.unwrap().title).toBe('Padrao atualizado');
    expect(result.unwrap().type).toBe('document_model');
    expect(result.unwrap().tags).toEqual(['padrao']);
    expect(result.unwrap().updatedBy).toBe('admin-1');
  });

  it('fails when item is archived', async () => {
    const item = KnowledgeItem.create({
      organizationId: OrganizationId.create('11111111-1111-4111-8111-111111111111'),
      createdBy: 'user-1',
      title: 'Modelo antigo',
      type: KnowledgeItemType.create('document_model'),
    });
    item.archive('admin-1');

    const repository = {
      findById: jest.fn().mockResolvedValue(item),
      save: jest.fn(),
    } as unknown as jest.Mocked<KnowledgeItemRepository>;

    const useCase = new UpdateKnowledgeItemUseCase(repository);

    const result = await useCase.execute({
      organizationId: '11111111-1111-4111-8111-111111111111',
      itemId: item.id,
      updatedBy: 'admin-1',
      title: 'Novo titulo',
    });

    expect(result.isFail()).toBe(true);
    expect(repository.save).not.toHaveBeenCalled();
    expect(result.unwrapError().message).toContain('Archived knowledge items cannot be updated.');
  });
});
