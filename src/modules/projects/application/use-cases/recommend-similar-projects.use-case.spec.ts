import type { ProjectRepository } from '../../domain/repositories/project.repository';
import type { ProjectBaseStructureRepository } from '../ports/project-base-structure.repository';
import { RecommendSimilarProjectsUseCase } from './recommend-similar-projects.use-case';

describe('RecommendSimilarProjectsUseCase', () => {
  const organizationId = '11111111-1111-4111-8111-111111111111';
  const tagId = '22222222-2222-4222-8222-222222222222';

  function createUseCase() {
    const projects = {
      ensureSelectableTags: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ProjectRepository>;
    const projectBaseStructure = {
      recommendByTags: jest.fn(),
      recommendSimilarProjects: jest.fn().mockResolvedValue([
        {
          project: {
            id: 'project-1',
            name: 'UBS Vila Esperanca',
            status: 'completed',
            progress: 0,
          },
          matchedTags: [
            {
              id: tagId,
              name: 'UBS',
              slug: 'ubs',
              category: 'project_type',
              status: 'active',
            },
          ],
          reason: 'Combina com UBS.',
          counters: {
            matchedTags: 1,
            deliverables: 4,
            documents: 2,
            reviews: 1,
          },
          score: 10,
        },
      ]),
      cloneStructure: jest.fn(),
    } as unknown as jest.Mocked<ProjectBaseStructureRepository>;

    return {
      projects,
      projectBaseStructure,
      useCase: new RecommendSimilarProjectsUseCase(
        projects,
        projectBaseStructure,
      ),
    };
  }

  it('validates governed tags and requests similar projects by tenant', async () => {
    const { projects, projectBaseStructure, useCase } = createUseCase();

    const result = await useCase.execute({
      organizationId,
      tagIds: [tagId, tagId],
      limit: 8,
    });

    expect(result.items).toHaveLength(1);
    expect(projects.ensureSelectableTags).toHaveBeenCalledWith({
      organizationId: expect.objectContaining({ value: organizationId }),
      tagIds: [tagId],
    });
    expect(projectBaseStructure.recommendSimilarProjects).toHaveBeenCalledWith({
      organizationId: expect.objectContaining({ value: organizationId }),
      tagIds: [tagId],
      limit: 8,
    });
  });

  it('returns empty result without tags', async () => {
    const { projects, projectBaseStructure, useCase } = createUseCase();

    await expect(
      useCase.execute({ organizationId, tagIds: [] }),
    ).resolves.toEqual({ items: [] });
    expect(projects.ensureSelectableTags).not.toHaveBeenCalled();
    expect(projectBaseStructure.recommendSimilarProjects).not.toHaveBeenCalled();
  });
});
