import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import { AuditQueryService } from '../../../audit/infrastructure/repositories/audit-query.service';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import { GetProjectDetailUseCase } from '../../application/use-cases/get-project-detail.use-case';
import { ListProjectsUseCase } from '../../application/use-cases/list-projects.use-case';
import { ProjectsController } from './projects.controller';

function createRequest(): AuthenticatedRequest {
  return {
    user: {
      userId: 'user-1',
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
    },
  } as AuthenticatedRequest;
}

describe('ProjectsController', () => {
  let createProjectUseCase: jest.Mocked<CreateProjectUseCase>;
  let listProjectsUseCase: jest.Mocked<ListProjectsUseCase>;
  let getProjectDetailUseCase: jest.Mocked<GetProjectDetailUseCase>;
  let audit: jest.Mocked<AuditQueryService>;
  let controller: ProjectsController;

  beforeEach(() => {
    createProjectUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateProjectUseCase>;
    listProjectsUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListProjectsUseCase>;
    getProjectDetailUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetProjectDetailUseCase>;
    audit = {
      record: jest.fn(),
    } as unknown as jest.Mocked<AuditQueryService>;
    controller = new ProjectsController(
      createProjectUseCase,
      listProjectsUseCase,
      getProjectDetailUseCase,
      audit,
    );
  });

  it('lists projects using tenant and filters from query', async () => {
    listProjectsUseCase.execute.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    });

    await expect(
      controller.list(
        { page: 1, pageSize: 10, name: 'ponte', status: 'active' },
        createRequest(),
      ),
    ).resolves.toEqual({
      data: { items: [], total: 0, page: 1, pageSize: 10 },
    });
    expect(listProjectsUseCase.execute).toHaveBeenCalledWith({
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      page: 1,
      pageSize: 10,
      name: 'ponte',
      status: 'active',
    });
  });

  it('returns project details when found', async () => {
    getProjectDetailUseCase.execute.mockResolvedValue({
      id: 'project-1',
      name: 'Ponte Norte',
      status: 'active',
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      progress: 35,
    });

    await expect(
      controller.detail('project-1', createRequest()),
    ).resolves.toEqual({
      data: {
        id: 'project-1',
        name: 'Ponte Norte',
        status: 'active',
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
        progress: 35,
      },
    });
  });

  it('maps missing project details to not found', async () => {
    getProjectDetailUseCase.execute.mockResolvedValue(null);

    await expect(
      controller.detail('project-1', createRequest()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates projects and records audit entries', async () => {
    createProjectUseCase.execute.mockResolvedValue(
      Result.ok({
        id: 'project-1',
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
        name: 'Ponte Norte',
        projectType: 'estrutural',
        status: 'draft',
      }),
    );

    await expect(
      controller.create(
        { name: 'Ponte Norte', projectType: 'estrutural' },
        createRequest(),
      ),
    ).resolves.toEqual({
      data: {
        id: 'project-1',
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
        name: 'Ponte Norte',
        projectType: 'estrutural',
        status: 'draft',
      },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
        action: 'project.created',
        entityId: 'project-1',
      }),
    );
  });

  it('maps failed creation to bad request', async () => {
    createProjectUseCase.execute.mockResolvedValue(
      Result.fail(new Error('Project name is required')),
    );

    await expect(
      controller.create(
        { name: '', projectType: 'estrutural' },
        createRequest(),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
