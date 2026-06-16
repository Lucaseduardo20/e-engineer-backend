import { randomUUID } from 'crypto';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Deliverable } from '../../domain/entities/deliverable';
import { DeliverableRepository } from '../../domain/repositories/deliverable.repository';
import { DeliverableStatus } from '../../domain/value-objects/deliverable-status.value-object';
import { DeliverableType } from '../../domain/value-objects/deliverable-type.value-object';
import { CreateDeliverableUseCase } from './create-deliverable.use-case';
import { DeleteDeliverableUseCase } from './delete-deliverable.use-case';
import { GetDeliverableUseCase } from './get-deliverable.use-case';
import { ListDeliverablesUseCase } from './list-deliverables.use-case';
import { MarkDeliverableInheritanceReviewedUseCase } from './mark-deliverable-inheritance-reviewed.use-case';
import { UpdateDeliverableUseCase } from './update-deliverable.use-case';

function createRepository(): jest.Mocked<DeliverableRepository> {
  return {
    findById: jest.fn(),
    getById: jest.fn(),
    list: jest.fn(),
    markInheritanceReviewed: jest.fn(),
    projectExists: jest.fn(),
    save: jest.fn(),
    syncTags: jest.fn(),
    delete: jest.fn(),
  };
}

describe('Deliverables use cases', () => {
  it('creates a deliverable scoped to the authenticated organization', async () => {
    const repository = createRepository();
    repository.projectExists.mockResolvedValue(true);
    const useCase = new CreateDeliverableUseCase(repository);
    const organizationId = randomUUID();
    const projectId = randomUUID();

    const result = await useCase.execute({
      organizationId,
      projectId,
      title: ' Memorial descritivo ',
      type: 'descriptive_memorial',
      status: 'todo',
      assignees: ['Lucas Eduardo'],
    });

    expect(result.isOk()).toBe(true);
    expect(repository.projectExists).toHaveBeenCalledWith(
      new UniqueEntityId(projectId),
      OrganizationId.create(organizationId),
    );
    expect(repository.save).toHaveBeenCalledWith(expect.any(Deliverable));
    expect(result.unwrap()).toMatchObject({
      projectId,
      title: 'Memorial descritivo',
      type: 'descriptive_memorial',
      status: 'todo',
      assignees: ['Lucas Eduardo'],
    });
  });

  it('rejects creation when the project is outside the tenant scope', async () => {
    const repository = createRepository();
    repository.projectExists.mockResolvedValue(false);
    const useCase = new CreateDeliverableUseCase(repository);

    const result = await useCase.execute({
      organizationId: randomUUID(),
      projectId: randomUUID(),
      title: 'Projeto estrutural',
      type: 'structural_project',
    });

    expect(result.isFail()).toBe(true);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('lists deliverables with organization and project scope', async () => {
    const repository = createRepository();
    repository.list.mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      pageSize: 10,
    });
    const useCase = new ListDeliverablesUseCase(repository);
    const organizationId = randomUUID();
    const projectId = randomUUID();

    await useCase.execute({
      organizationId,
      projectId,
      page: 2,
      pageSize: 10,
      status: 'blocked',
    });

    expect(repository.list).toHaveBeenCalledWith(
      OrganizationId.create(organizationId),
      {
        projectId: new UniqueEntityId(projectId),
        page: 2,
        pageSize: 10,
        status: 'blocked',
      },
    );
  });

  it('gets a single deliverable by tenant scope', async () => {
    const repository = createRepository();
    const useCase = new GetDeliverableUseCase(repository);
    const organizationId = randomUUID();
    const deliverableId = randomUUID();

    await useCase.execute({ organizationId, deliverableId });

    expect(repository.getById).toHaveBeenCalledWith(
      new UniqueEntityId(deliverableId),
      OrganizationId.create(organizationId),
    );
  });

  it('updates a deliverable through domain behavior', async () => {
    const repository = createRepository();
    const deliverable = Deliverable.create({
      organizationId: OrganizationId.create(randomUUID()),
      projectId: new UniqueEntityId(),
      title: 'Projeto eletrico',
      type: DeliverableType.create('electrical_project'),
      status: DeliverableStatus.todo(),
    });
    repository.findById.mockResolvedValue(deliverable);
    const useCase = new UpdateDeliverableUseCase(repository);

    const result = await useCase.execute({
      organizationId: deliverable.organizationId.toString(),
      deliverableId: deliverable.id,
      status: 'done',
      assignees: ['Leonardo', 'Leonardo'],
    });

    expect(result.isOk()).toBe(true);
    expect(repository.save).toHaveBeenCalledWith(deliverable);
    expect(result.unwrap()).toMatchObject({
      status: 'done',
      assignees: ['Leonardo'],
    });
  });

  it('marks an inherited deliverable as reviewed', async () => {
    const repository = createRepository();
    const organizationId = randomUUID();
    const deliverableId = randomUUID();
    repository.markInheritanceReviewed.mockResolvedValue({
      id: deliverableId,
      projectId: randomUUID(),
      title: 'Orcamento',
      status: 'todo',
      type: 'budget',
      assignees: [],
      inheritanceReview: {
        relationId: randomUUID(),
        baseProjectId: randomUUID(),
        baseDeliverableId: randomUUID(),
        needsReviewAfterInheritance: false,
        reviewedBy: 'coord-1',
        reviewedAt: '2026-06-16T12:00:00.000Z',
      },
    });
    const useCase = new MarkDeliverableInheritanceReviewedUseCase(repository);

    const result = await useCase.execute({
      organizationId,
      deliverableId,
      reviewedBy: 'coord-1',
    });

    expect(result.isOk()).toBe(true);
    expect(repository.markInheritanceReviewed).toHaveBeenCalledWith({
      organizationId: OrganizationId.create(organizationId),
      deliverableId: new UniqueEntityId(deliverableId),
      reviewedBy: 'coord-1',
    });
    expect(result.unwrap().inheritanceReview?.needsReviewAfterInheritance).toBe(false);
  });

  it('removes a deliverable using tenant scope', async () => {
    const repository = createRepository();
    repository.delete.mockResolvedValue(true);
    const useCase = new DeleteDeliverableUseCase(repository);
    const organizationId = randomUUID();
    const deliverableId = randomUUID();

    const result = await useCase.execute({ organizationId, deliverableId });

    expect(result.isOk()).toBe(true);
    expect(repository.delete).toHaveBeenCalledWith({
      organizationId: OrganizationId.create(organizationId),
      deliverableId: new UniqueEntityId(deliverableId),
    });
  });
});
