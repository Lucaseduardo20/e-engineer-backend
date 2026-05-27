import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import { CreateDeliverableUseCase } from '../../application/use-cases/create-deliverable.use-case';
import { GetDeliverableUseCase } from '../../application/use-cases/get-deliverable.use-case';
import { ListDeliverablesUseCase } from '../../application/use-cases/list-deliverables.use-case';
import { UpdateDeliverableUseCase } from '../../application/use-cases/update-deliverable.use-case';
import { DeliverablesController } from './deliverables.controller';

function createRequest(): AuthenticatedRequest {
  return {
    user: {
      userId: 'user-1',
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
    },
  } as AuthenticatedRequest;
}

describe('DeliverablesController', () => {
  let createDeliverableUseCase: jest.Mocked<CreateDeliverableUseCase>;
  let listDeliverablesUseCase: jest.Mocked<ListDeliverablesUseCase>;
  let getDeliverableUseCase: jest.Mocked<GetDeliverableUseCase>;
  let updateDeliverableUseCase: jest.Mocked<UpdateDeliverableUseCase>;
  let controller: DeliverablesController;

  beforeEach(() => {
    createDeliverableUseCase = { execute: jest.fn() } as never;
    listDeliverablesUseCase = { execute: jest.fn() } as never;
    getDeliverableUseCase = { execute: jest.fn() } as never;
    updateDeliverableUseCase = { execute: jest.fn() } as never;
    controller = new DeliverablesController(
      createDeliverableUseCase,
      listDeliverablesUseCase,
      getDeliverableUseCase,
      updateDeliverableUseCase,
    );
  });

  it('lists deliverables using the authenticated organization', async () => {
    listDeliverablesUseCase.execute.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    });

    await expect(
      controller.list(
        {
          projectId: '5c6c3c65-3e8a-4f0c-9235-8f65828951f1',
          page: 1,
          pageSize: 10,
          status: 'todo',
        },
        createRequest(),
      ),
    ).resolves.toEqual({
      data: { items: [], total: 0, page: 1, pageSize: 10 },
    });
    expect(listDeliverablesUseCase.execute).toHaveBeenCalledWith({
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      projectId: '5c6c3c65-3e8a-4f0c-9235-8f65828951f1',
      page: 1,
      pageSize: 10,
      status: 'todo',
    });
  });

  it('returns deliverable details in the shared envelope', async () => {
    getDeliverableUseCase.execute.mockResolvedValue({
      id: 'deliverable-1',
      projectId: 'project-1',
      title: 'Memorial descritivo',
      type: 'descriptive_memorial',
      status: 'todo',
      assignees: [],
    });

    await expect(controller.detail('deliverable-1', createRequest())).resolves.toEqual({
      data: {
        id: 'deliverable-1',
        projectId: 'project-1',
        title: 'Memorial descritivo',
        type: 'descriptive_memorial',
        status: 'todo',
        assignees: [],
      },
    });
  });

  it('maps missing deliverables to not found', async () => {
    getDeliverableUseCase.execute.mockResolvedValue(null);

    await expect(controller.detail('missing', createRequest())).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates deliverables without accepting organizationId from the body', async () => {
    createDeliverableUseCase.execute.mockResolvedValue(
      Result.ok({
        id: 'deliverable-1',
        projectId: 'project-1',
        title: 'Projeto estrutural',
        type: 'structural_project',
        status: 'todo',
        assignees: ['Lucas'],
      }),
    );

    await controller.create(
      {
        projectId: 'project-1',
        title: 'Projeto estrutural',
        type: 'structural_project',
        assignees: ['Lucas'],
      },
      createRequest(),
    );

    expect(createDeliverableUseCase.execute).toHaveBeenCalledWith({
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      projectId: 'project-1',
      title: 'Projeto estrutural',
      type: 'structural_project',
      assignees: ['Lucas'],
    });
  });

  it('maps failed creation to bad request', async () => {
    createDeliverableUseCase.execute.mockResolvedValue(
      Result.fail(new Error('Project not found.')),
    );

    await expect(
      controller.create(
        {
          projectId: 'project-1',
          title: 'Projeto estrutural',
          type: 'structural_project',
        },
        createRequest(),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates deliverables and maps missing records to not found', async () => {
    updateDeliverableUseCase.execute.mockResolvedValue(
      Result.fail(new Error('Deliverable not found.')),
    );

    await expect(
      controller.update('deliverable-1', { status: 'done' }, createRequest()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
