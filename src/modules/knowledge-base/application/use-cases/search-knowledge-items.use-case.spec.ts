import { SearchKnowledgeItemsUseCase } from './search-knowledge-items.use-case';
import type { KnowledgeItemRepository } from '../../domain/repositories/knowledge-item.repository';

describe('SearchKnowledgeItemsUseCase', () => {
  it('normalizes filters and delegates tenant scoped search', async () => {
    const repository = {
      search: jest.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
      }),
    } as unknown as jest.Mocked<KnowledgeItemRepository>;
    const useCase = new SearchKnowledgeItemsUseCase(repository);

    await useCase.execute({
      organizationId: '11111111-1111-4111-8111-111111111111',
      query: ' memorial ',
      type: 'document_model',
      tags: [' Memorial '],
      page: 1,
      pageSize: 10,
    });

    expect(repository.search).toHaveBeenCalledWith(expect.anything(), {
      page: 1,
      pageSize: 10,
      query: 'memorial',
      type: 'document_model',
      status: 'published',
      tags: ['memorial'],
      includeArchived: false,
    });
  });
});
