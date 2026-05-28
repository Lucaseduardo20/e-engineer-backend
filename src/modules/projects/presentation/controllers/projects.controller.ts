import {
  Body,
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/infrastructure/auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import {
  ok,
  type ApiResponse,
} from '../../../../shared/presentation/api-response';
import type {
  Paginated,
  Project,
} from '../../../../shared/contracts/dashboard.contracts';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import { GetProjectDetailUseCase } from '../../application/use-cases/get-project-detail.use-case';
import { ListProjectsUseCase } from '../../application/use-cases/list-projects.use-case';
import { CreateProjectRequestDto } from '../dto/create-project.request.dto';
import { ListProjectsQueryDto } from '../dto/list-projects-query.dto';
import { UpdateProjectStatusDto } from '../dto/update-project-status.dto';
import { CreateProjectOutputDto } from '../../application/dto/create-project.dto';
import { UpdateProjectStatusUseCase } from '../../application/use-cases/update-project-status.use-case';
import { AuditQueryService } from '../../../audit/infrastructure/repositories/audit-query.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly listProjectsUseCase: ListProjectsUseCase,
    private readonly getProjectDetailUseCase: GetProjectDetailUseCase,
    private readonly updateProjectStatusUseCase: UpdateProjectStatusUseCase,
    private readonly audit: AuditQueryService,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Lista paginada de projetos tecnicos.' })
  async list(
    @Query() query: ListProjectsQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<Paginated<Project>>> {
    return ok(
      await this.listProjectsUseCase.execute({
        organizationId: request.user.organizationId,
        page: query.page,
        pageSize: query.pageSize,
        name: query.name,
        status: query.status,
      }),
    );
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalhe de um projeto tecnico.' })
  async detail(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<Project>> {
    const project = await this.getProjectDetailUseCase.execute({
      projectId: id,
      organizationId: request.user.organizationId,
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return ok(project);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Projeto tecnico criado.' })
  async create(
    @Body() body: CreateProjectRequestDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<CreateProjectOutputDto>> {
    const result = await this.createProjectUseCase.execute({
      ...body,
      organizationId: request.user.organizationId,
    });

    if (result.isFail()) {
      throw new BadRequestException(result.unwrapError().message);
    }

    const project = result.unwrap();
    await this.audit.record({
      organizationId: request.user.organizationId,
      actorName: request.user.userId,
      action: 'project.created',
      entityType: 'project',
      entityId: project.id,
      description: 'Projeto tecnico criado',
      metadata: { name: project.name },
    });

    return ok(project);
  }

  @Patch(':id/status')
  @ApiOkResponse({ description: 'Status do projeto tecnico atualizado.' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateProjectStatusDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<Project>> {
    const result = await this.updateProjectStatusUseCase.execute({
      projectId: id,
      organizationId: request.user.organizationId,
      status: body.status,
    });

    if (result.isFail()) {
      const error = result.unwrapError();

      if (error.message === 'Project not found.') {
        throw new NotFoundException(error.message);
      }

      throw new BadRequestException(error.message);
    }

    const project = result.unwrap();
    await this.audit.record({
      organizationId: request.user.organizationId,
      actorName: request.user.userId,
      action: 'project.status.updated',
      entityType: 'project',
      entityId: project.id,
      description: `Status do projeto atualizado para ${body.status}`,
      metadata: { status: body.status },
    });

    return ok(project);
  }
}
