import { randomUUID } from 'crypto';
import { AuthorizationService } from '../../../../shared/application/authorization/authorization.service';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { PriorityRequest } from '../../domain/entities/priority-request';
import type { PriorityRequestRepository } from '../../domain/repositories/priority-request.repository';
import { CreatePriorityRequestUseCase } from './create-priority-request.use-case';
import { DecidePriorityRequestUseCase } from './decide-priority-request.use-case';

describe('Priority request use cases', () => {
  it('auto-applies requests from actors allowed to apply priority', async () => {
    const repository: Pick<PriorityRequestRepository, 'save'> = {
      save: jest.fn(),
    };
    const useCase = new CreatePriorityRequestUseCase(
      repository as PriorityRequestRepository,
      new AuthorizationService(),
    );

    const result = await useCase.execute({
      organizationId: randomUUID(),
      requestedBy: randomUUID(),
      actorRoles: ['manager'],
      targetType: 'project',
      targetId: randomUUID(),
      priority: 'urgent',
      reason: 'Cliente aguardando obra',
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().status).toBe('applied');
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('keeps member requests pending for approval', async () => {
    const useCase = new CreatePriorityRequestUseCase(
      { save: jest.fn() } as never,
      new AuthorizationService(),
    );

    const result = await useCase.execute({
      organizationId: randomUUID(),
      requestedBy: randomUUID(),
      actorRoles: ['member'],
      targetType: 'deliverable',
      targetId: randomUUID(),
      requestedForUserId: randomUUID(),
      priority: 'high',
    });

    expect(result.unwrap().status).toBe('requested');
    expect(result.unwrap().targetType).toBe('deliverable');
    expect(result.unwrap().requestedForUserId).toBeTruthy();
  });

  it('applies a pending request inside the same tenant', async () => {
    const organizationId = OrganizationId.create(randomUUID());
    const priorityRequest = PriorityRequest.create({
      organizationId,
      targetType: 'review',
      targetId: randomUUID(),
      requestedBy: randomUUID(),
      priority: 'high',
    });
    const repository: Pick<PriorityRequestRepository, 'findById' | 'save'> = {
      findById: jest.fn().mockResolvedValue(priorityRequest),
      save: jest.fn(),
    };
    const useCase = new DecidePriorityRequestUseCase(
      repository as PriorityRequestRepository,
    );

    const result = await useCase.execute({
      organizationId: organizationId.toString(),
      priorityRequestId: priorityRequest.id,
      decidedBy: randomUUID(),
      decision: 'apply',
    });

    expect(result.isOk()).toBe(true);
    expect(repository.findById).toHaveBeenCalledWith(
      priorityRequest.id,
      organizationId,
    );
  });
});
