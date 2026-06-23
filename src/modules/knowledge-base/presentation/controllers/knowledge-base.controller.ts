import {
  BadRequestException,
  Body,
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
import { permissions } from '../../../../shared/application/authorization/permissions';
import type { Paginated } from '../../../../shared/contracts/dashboard.contracts';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import { JwtAuthGuard } from '../../../../shared/infrastructure/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../../shared/infrastructure/auth/permissions.guard';
import { RequirePermissions } from '../../../../shared/infrastructure/auth/require-permissions.decorator';
import {
  ok,
  type ApiResponse,
} from '../../../../shared/presentation/api-response';
import { ArchiveKnowledgeItemUseCase } from '../../application/use-cases/archive-knowledge-item.use-case';
import { DeprecateKnowledgeItemUseCase } from '../../application/use-cases/deprecate-knowledge-item.use-case';
import { CreateKnowledgeItemUseCase } from '../../application/use-cases/create-knowledge-item.use-case';
import { GetKnowledgeItemDetailsUseCase } from '../../application/use-cases/get-knowledge-item-details.use-case';
import { LinkKnowledgeItemUseCase } from '../../application/use-cases/link-knowledge-item.use-case';
import { ListKnowledgeItemsUseCase } from '../../application/use-cases/list-knowledge-items.use-case';
import { PromoteProjectToKnowledgeUseCase } from '../../application/use-cases/promote-project-to-knowledge.use-case';
import { PublishKnowledgeItemUseCase } from '../../application/use-cases/publish-knowledge-item.use-case';
import { SearchKnowledgeItemsUseCase } from '../../application/use-cases/search-knowledge-items.use-case';
import { UpdateKnowledgeItemUseCase } from '../../application/use-cases/update-knowledge-item.use-case';
import { UnlinkKnowledgeItemUseCase } from '../../application/use-cases/unlink-knowledge-item.use-case';
import type {
  KnowledgeItemDetailResponse,
  KnowledgeItemResponse,
  KnowledgeRelationResponse,
} from '../../domain/repositories/knowledge-item.repository';
import { CreateKnowledgeItemDto } from '../dto/create-knowledge-item.dto';
import { LinkKnowledgeItemDto } from '../dto/link-knowledge-item.dto';
import {
  ListKnowledgeItemsQueryDto,
  SearchKnowledgeItemsQueryDto,
} from '../dto/list-knowledge-items-query.dto';
import { PromoteProjectToKnowledgeDto } from '../dto/promote-project-to-knowledge.dto';
import { UpdateKnowledgeItemDto } from '../dto/update-knowledge-item.dto';

@ApiTags('knowledge-base')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class KnowledgeBaseController {
  constructor(
    private readonly createKnowledgeItem: CreateKnowledgeItemUseCase,
    private readonly listKnowledgeItems: ListKnowledgeItemsUseCase,
    private readonly searchKnowledgeItems: SearchKnowledgeItemsUseCase,
    private readonly getKnowledgeItemDetails: GetKnowledgeItemDetailsUseCase,
    private readonly updateKnowledgeItem: UpdateKnowledgeItemUseCase,
    private readonly publishKnowledgeItem: PublishKnowledgeItemUseCase,
    private readonly archiveKnowledgeItem: ArchiveKnowledgeItemUseCase,
    private readonly deprecateKnowledgeItem: DeprecateKnowledgeItemUseCase,
    private readonly linkKnowledgeItem: LinkKnowledgeItemUseCase,
    private readonly promoteProjectToKnowledge: PromoteProjectToKnowledgeUseCase,
    private readonly unlinkKnowledgeItem: UnlinkKnowledgeItemUseCase,
  ) {}

  @Post('knowledge-base')
  @RequirePermissions(permissions.knowledge.create)
  @ApiCreatedResponse({ description: 'Item de conhecimento criado.' })
  async create(
    @Body() body: CreateKnowledgeItemDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<KnowledgeItemResponse>> {
    const result = await this.createKnowledgeItem.execute({
      ...body,
      organizationId: request.user.organizationId,
      createdBy: request.user.userId,
    });

    return ok(this.unwrapResult(result));
  }

  @Get('knowledge-base')
  @RequirePermissions(permissions.knowledge.read)
  @ApiOkResponse({ description: 'Lista paginada da base de conhecimento.' })
  list(
    @Query() query: ListKnowledgeItemsQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<Paginated<KnowledgeItemResponse>>> {
    return this.listKnowledgeItems
      .execute({
        organizationId: request.user.organizationId,
        type: query.type,
        status: query.status,
        tags: query.tags,
        page: query.page,
        pageSize: query.pageSize,
        includeArchived: query.includeArchived,
      })
      .then(ok);
  }

  @Get('knowledge-base/search')
  @RequirePermissions(permissions.knowledge.read)
  @ApiOkResponse({ description: 'Busca itens da base de conhecimento.' })
  search(
    @Query() query: SearchKnowledgeItemsQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<Paginated<KnowledgeItemResponse>>> {
    return this.searchKnowledgeItems
      .execute({
        organizationId: request.user.organizationId,
        query: query.q,
        type: query.type,
        status: query.status,
        tags: query.tags,
        page: query.page,
        pageSize: query.pageSize,
        includeArchived: query.includeArchived,
      })
      .then(ok);
  }

  @Get('knowledge-base/:id')
  @RequirePermissions(permissions.knowledge.read)
  @ApiOkResponse({ description: 'Detalhe de item da base de conhecimento.' })
  async detail(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<KnowledgeItemDetailResponse>> {
    const item = await this.getKnowledgeItemDetails.execute({
      organizationId: request.user.organizationId,
      itemId: id,
    });

    if (!item) {
      throw new NotFoundException('Knowledge item not found.');
    }

    return ok(item);
  }

  @Patch('knowledge-base/:id')
  @RequirePermissions(permissions.knowledge.update)
  @ApiOkResponse({ description: 'Item da base atualizado.' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateKnowledgeItemDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<KnowledgeItemResponse>> {
    const result = await this.updateKnowledgeItem.execute({
      ...body,
      organizationId: request.user.organizationId,
      itemId: id,
      updatedBy: request.user.userId,
    });

    return ok(this.unwrapResult(result));
  }

  @Post('knowledge-base/:id/publish')
  @RequirePermissions(permissions.knowledge.publish)
  @ApiOkResponse({ description: 'Item da base publicado.' })
  async publish(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<KnowledgeItemResponse>> {
    const result = await this.publishKnowledgeItem.execute({
      organizationId: request.user.organizationId,
      itemId: id,
      publishedBy: request.user.userId,
    });

    return ok(this.unwrapResult(result));
  }

  @Post('knowledge-base/:id/archive')
  @RequirePermissions(permissions.knowledge.archive)
  @ApiOkResponse({ description: 'Item da base arquivado.' })
  async archive(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<KnowledgeItemResponse>> {
    const result = await this.archiveKnowledgeItem.execute({
      organizationId: request.user.organizationId,
      itemId: id,
      archivedBy: request.user.userId,
    });

    return ok(this.unwrapResult(result));
  }

  @Post('knowledge-base/:id/deprecate')
  @RequirePermissions(permissions.knowledge.deprecate)
  @ApiOkResponse({ description: 'Item da base marcado como obsoleto.' })
  async deprecate(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<KnowledgeItemResponse>> {
    const result = await this.deprecateKnowledgeItem.execute({
      organizationId: request.user.organizationId,
      itemId: id,
      deprecatedBy: request.user.userId,
    });

    return ok(this.unwrapResult(result));
  }

  @Post('knowledge-base/:id/relations')
  @RequirePermissions(permissions.knowledge.link)
  @ApiCreatedResponse({ description: 'Relacao de conhecimento criada.' })
  async link(
    @Param('id') id: string,
    @Body() body: LinkKnowledgeItemDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<KnowledgeRelationResponse>> {
    const result = await this.linkKnowledgeItem.execute({
      ...body,
      organizationId: request.user.organizationId,
      itemId: id,
      linkedBy: request.user.userId,
    });

    return ok(this.unwrapResult(result));
  }

  @Post('knowledge-base/:id/relations/:relationId/remove')
  @RequirePermissions(permissions.knowledge.unlink)
  @ApiOkResponse({ description: 'Relacao de conhecimento removida.' })
  async unlink(
    @Param('id') id: string,
    @Param('relationId') relationId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<{ removed: true }>> {
    const result = await this.unlinkKnowledgeItem.execute({
      organizationId: request.user.organizationId,
      itemId: id,
      relationId,
    });

    return ok(this.unwrapResult(result));
  }

  @Post('projects/:projectId/promote-to-knowledge')
  @RequirePermissions(permissions.knowledge.promoteProject)
  @ApiCreatedResponse({ description: 'Projeto promovido para referencia.' })
  async promoteProject(
    @Param('projectId') projectId: string,
    @Body() body: PromoteProjectToKnowledgeDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<KnowledgeItemResponse>> {
    const result = await this.promoteProjectToKnowledge.execute({
      ...body,
      organizationId: request.user.organizationId,
      projectId,
      createdBy: request.user.userId,
    });

    return ok(this.unwrapResult(result));
  }

  private unwrapResult<T>(result: {
    isFail(): boolean;
    unwrap(): T;
    unwrapError(): Error;
  }): T {
    if (result.isFail()) {
      const error = result.unwrapError();

      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }

      throw new BadRequestException(error.message);
    }

    return result.unwrap();
  }
}
