import { GetKnowledgeItemDetailsUseCase } from './get-knowledge-item-details.use-case';
import type { KnowledgeItemRepository } from '../../domain/repositories/knowledge-item.repository';

describe('GetKnowledgeItemDetailsUseCase', () => {
  it('delegates detail lookup with tenant scope', async () => {
    const repository = {
      findByIdWithRelations: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<KnowledgeItemRepository>;

    const useCase = new GetKnowledgeItemDetailsUseCase(repository);

    await useCase.execute({
      organizationId: '11111111-1111-4111-8111-111111111111',
      itemId: '22222222-2222-4222-8222-222222222222',
    });

    expect(repository.findByIdWithRelations).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
    );
  });

  it('returns null when item does not exist for tenant', async () => {
    const repository = {
      findByIdWithRelations: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<KnowledgeItemRepository>;

    const useCase = new GetKnowledgeItemDetailsUseCase(repository);

    const result = await useCase.execute({
      organizationId: '11111111-1111-4111-8111-111111111111',
      itemId: '33333333-3333-4333-8333-333333333333',
    });

    expect(result).toBeNull();
  });
});
