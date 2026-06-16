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
import { PermissionsGuard } from '../../../../shared/infrastructure/auth/permissions.guard';
import { RequirePermissions } from '../../../../shared/infrastructure/auth/require-permissions.decorator';
import { permissions } from '../../../../shared/application/authorization/permissions';
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
import { GetProjectTechnicalProfileUseCase } from '../../application/use-cases/get-project-technical-profile.use-case';
import { ListProjectsUseCase } from '../../application/use-cases/list-projects.use-case';
import { CreateProjectRequestDto } from '../dto/create-project.request.dto';
import { ListProjectsQueryDto } from '../dto/list-projects-query.dto';
import { UpdateProjectRequestDto } from '../dto/update-project.request.dto';
import { UpdateProjectStatusDto } from '../dto/update-project-status.dto';
import { CreateProjectOutputDto } from '../../application/dto/create-project.dto';
import { UpdateProjectUseCase } from '../../application/use-cases/update-project.use-case';
import { UpdateProjectStatusUseCase } from '../../application/use-cases/update-project-status.use-case';
import { AuditQueryService } from '../../../audit/infrastructure/repositories/audit-query.service';
import { ListProjectKnowledgeItemsUseCase } from '../../application/use-cases/list-project-knowledge-items.use-case';
import { LinkKnowledgeItemToProjectUseCase } from '../../application/use-cases/link-knowledge-item-to-project.use-case';
import { UnlinkKnowledgeItemFromProjectUseCase } from '../../application/use-cases/unlink-knowledge-item-from-project.use-case';
import { RecommendKnowledgeForProjectUseCase } from '../../application/use-cases/recommend-knowledge-for-project.use-case';
import { RecommendProjectBasesByTagsUseCase } from '../../application/use-cases/recommend-project-bases-by-tags.use-case';
import { LinkProjectKnowledgeDto } from '../dto/link-project-knowledge.dto';
import { RecommendProjectBasesDto } from '../dto/recommend-project-bases.dto';
import type { ProjectTechnicalProfileResponseDto } from '../../application/dto/project-technical-profile.dto';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly listProjectsUseCase: ListProjectsUseCase,
    private readonly getProjectDetailUseCase: GetProjectDetailUseCase,
    private readonly getProjectTechnicalProfileUseCase: GetProjectTechnicalProfileUseCase,
    private readonly updateProjectUseCase: UpdateProjectUseCase,
    private readonly updateProjectStatusUseCase: UpdateProjectStatusUseCase,
    private readonly audit: AuditQueryService,
    private readonly listProjectKnowledgeItemsUseCase: ListProjectKnowledgeItemsUseCase,
    private readonly linkKnowledgeItemToProjectUseCase: LinkKnowledgeItemToProjectUseCase,
    private readonly unlinkKnowledgeItemFromProjectUseCase: UnlinkKnowledgeItemFromProjectUseCase,
    private readonly recommendKnowledgeForProjectUseCase: RecommendKnowledgeForProjectUseCase,
    private readonly recommendProjectBasesByTagsUseCase: RecommendProjectBasesByTagsUseCase,
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

  @Post('recommend-bases')
  @ApiOkResponse({ description: 'Projetos base recomendados por tags tecnicas.' })
  async recommendBases(
    @Body() body: RecommendProjectBasesDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<{ items: unknown[] }>> {
    return ok(
      await this.recommendProjectBasesByTagsUseCase.execute({
        organizationId: request.user.organizationId,
        tagIds: body.tagIds,
        limit: body.limit,
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

  @Get(':id/technical-profile')
  @ApiOkResponse({
    description: 'Perfil tecnico calculado por tags governadas do projeto.',
  })
  async technicalProfile(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<ProjectTechnicalProfileResponseDto>> {
    const profile = await this.getProjectTechnicalProfileUseCase.execute({
      projectId: id,
      organizationId: request.user.organizationId,
    });

    if (!profile) {
      throw new NotFoundException('Project not found.');
    }

    return ok(profile);
  }

  @Get(':id/knowledge/recommendations')
  @ApiOkResponse({ description: 'Recomendacoes de knowledge por tags do projeto.' })
  @RequirePermissions(permissions.knowledge.read)
  async recommendKnowledge(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<{ items: unknown[] }>> {
    const result = await this.recommendKnowledgeForProjectUseCase.execute({
      organizationId: request.user.organizationId,
      projectId: id,
    });

    if (!result) {
      throw new NotFoundException('Project not found.');
    }

    return ok(result);
  }


  @Get(':id/knowledge')
  @ApiOkResponse({ description: 'Conhecimento aplicado ao projeto.' })
  @RequirePermissions(permissions.knowledge.read)
  async listKnowledge(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<{ items: unknown[] }>> {
    const result = await this.listProjectKnowledgeItemsUseCase.execute({
      organizationId: request.user.organizationId,
      projectId: id,
    });

    if (!result) {
      throw new NotFoundException('Project not found.');
    }

    return ok(result);
  }

  @Post(':id/knowledge')
  @ApiCreatedResponse({ description: 'Knowledge item vinculado ao projeto.' })
  @RequirePermissions(permissions.knowledge.link)
  async linkKnowledge(
    @Param('id') id: string,
    @Body() body: LinkProjectKnowledgeDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.linkKnowledgeItemToProjectUseCase.execute({
      organizationId: request.user.organizationId,
      projectId: id,
      knowledgeItemId: body.knowledgeItemId,
      relationType: body.relationType,
      deliverableId: body.deliverableId,
      linkedBy: request.user.userId,
    });

    if (result.isFail()) {
      throw new BadRequestException(result.unwrapError().message);
    }

    return ok(result.unwrap());
  }

  @Post(':id/knowledge/:relationId/remove')
  @ApiOkResponse({
    description: 'Vinculo de conhecimento removido do projeto.',
  })
  @RequirePermissions(permissions.knowledge.unlink)
  async unlinkKnowledge(
    @Param('id') id: string,
    @Param('relationId') relationId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<{ removed: true }>> {
    const result = await this.unlinkKnowledgeItemFromProjectUseCase.execute({
      organizationId: request.user.organizationId,
      projectId: id,
      relationId,
    });

    if (result.isFail()) {
      const error = result.unwrapError();
      if (error.message === 'Project not found.') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }

    return ok(result.unwrap());
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
      createdBy: request.user.userId,
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

  @Patch(':id')
  @ApiOkResponse({ description: 'Projeto tecnico atualizado.' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateProjectRequestDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<Project>> {
    const result = await this.updateProjectUseCase.execute({
      projectId: id,
      organizationId: request.user.organizationId,
      name: body.name,
      projectType: body.projectType,
      tagIds: body.tagIds,
      updatedBy: request.user.userId,
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
      action: 'project.updated',
      entityType: 'project',
      entityId: project.id,
      description: 'Projeto tecnico atualizado',
      metadata: { name: project.name, tagIds: project.tagIds ?? [] },
    });

    return ok(project);
  }
}
