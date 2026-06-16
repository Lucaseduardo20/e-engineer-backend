import type { ProjectBaseStructureRepository } from '../ports/project-base-structure.repository';
import { RecommendProjectBasesByTagsUseCase } from './recommend-project-bases-by-tags.use-case';

describe('RecommendProjectBasesByTagsUseCase', () => {
  it('recommends project bases by governed tags in the tenant scope', async () => {
    const repository = {
      recommendByTags: jest.fn().mockResolvedValue([
        {
          project: {
            id: 'project-1',
            name: 'UBS modelo',
            status: 'active',
            progress: 0,
          },
          matchedTags: [],
          deliverablesPreview: [],
          documentsPreview: [],
          reviewsCount: 0,
          score: 10,
        },
      ]),
      cloneStructure: jest.fn(),
    } as unknown as jest.Mocked<ProjectBaseStructureRepository>;
    const useCase = new RecommendProjectBasesByTagsUseCase(repository);

    const result = await useCase.execute({
      organizationId: '11111111-1111-4111-8111-111111111111',
      tagIds: [
        '22222222-2222-4222-8222-222222222222',
        '22222222-2222-4222-8222-222222222222',
      ],
    });

    expect(result.items).toHaveLength(1);
    expect(repository.recommendByTags).toHaveBeenCalledWith({
      organizationId: expect.objectContaining({
        value: '11111111-1111-4111-8111-111111111111',
      }),
      tagIds: ['22222222-2222-4222-8222-222222222222'],
      limit: 6,
    });
  });

  it('returns no recommendations without tags', async () => {
    const repository = {
      recommendByTags: jest.fn(),
      cloneStructure: jest.fn(),
    } as unknown as jest.Mocked<ProjectBaseStructureRepository>;
    const useCase = new RecommendProjectBasesByTagsUseCase(repository);

    await expect(
      useCase.execute({
        organizationId: '11111111-1111-4111-8111-111111111111',
        tagIds: [],
      }),
    ).resolves.toEqual({ items: [] });
    expect(repository.recommendByTags).not.toHaveBeenCalled();
  });
});
