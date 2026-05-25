import { randomUUID } from 'crypto';
import { DomainEventPublisher } from '../../../../shared/application/ports/domain-event-publisher';
import { Project } from '../../domain/entities/project';
import { ProjectRepository } from '../../domain/repositories/project.repository';
import { CreateProjectUseCase } from './create-project.use-case';

class InMemoryProjectRepository implements ProjectRepository {
  readonly projects: Project[] = [];

  save(project: Project): Promise<void> {
    this.projects.push(project);
    return Promise.resolve();
  }

  findById(): Promise<Project | null> {
    return Promise.resolve(null);
  }
}

describe('CreateProjectUseCase', () => {
  let projectRepository: InMemoryProjectRepository;
  let domainEventPublisher: jest.Mocked<DomainEventPublisher>;
  let useCase: CreateProjectUseCase;

  beforeEach(() => {
    projectRepository = new InMemoryProjectRepository();
    domainEventPublisher = {
      publish: jest.fn(),
      publishAll: jest.fn(),
      register: jest.fn(),
    };
    useCase = new CreateProjectUseCase(projectRepository, domainEventPublisher);
  });

  it('creates a technical engineering project scoped by organization', async () => {
    const organizationId = randomUUID();

    const result = await useCase.execute({
      organizationId,
      name: 'Reforma de Escola Municipal',
      projectType: 'reforma escolar',
    });

    expect(result.isOk()).toBe(true);
    expect(projectRepository.projects).toHaveLength(1);
    const publishedEvents = domainEventPublisher.publishAll.mock.calls[0][0];

    expect(publishedEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventName: 'ProjectCreated',
          organizationId,
        }),
      ]),
    );
    expect(result.unwrap()).toMatchObject({
      organizationId,
      name: 'Reforma de Escola Municipal',
      projectType: 'reforma escolar',
      status: 'draft',
    });
  });

  it('rejects projects without a technical project name', async () => {
    const result = await useCase.execute({
      organizationId: randomUUID(),
      name: '   ',
      projectType: 'drenagem',
    });

    expect(result.isFail()).toBe(true);
    expect(result.unwrapError().message).toBe('Project name is required');
    expect(projectRepository.projects).toHaveLength(0);
  });
});
