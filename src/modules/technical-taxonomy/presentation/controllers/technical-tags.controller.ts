import { BadRequestException, Controller, Get, NotFoundException, Param, Patch, Post, Query, Req, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Paginated } from '../../../../shared/contracts/dashboard.contracts';
import { permissions } from '../../../../shared/application/authorization/permissions';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import { JwtAuthGuard } from '../../../../shared/infrastructure/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../../shared/infrastructure/auth/permissions.guard';
import { RequirePermissions } from '../../../../shared/infrastructure/auth/require-permissions.decorator';
import { ok, type ApiResponse } from '../../../../shared/presentation/api-response';
import type { TechnicalTagResponse } from '../../domain/repositories/technical-tag.repository';
import { ArchiveTechnicalTagUseCase } from '../../application/use-cases/archive-technical-tag.use-case';
import { CreateTechnicalTagUseCase } from '../../application/use-cases/create-technical-tag.use-case';
import { DeprecateTechnicalTagUseCase } from '../../application/use-cases/deprecate-technical-tag.use-case';
import { GetTechnicalTagDetailsUseCase } from '../../application/use-cases/get-technical-tag-details.use-case';
import { ListTechnicalTagsUseCase } from '../../application/use-cases/list-technical-tags.use-case';
import { UpdateTechnicalTagUseCase } from '../../application/use-cases/update-technical-tag.use-case';
import { CreateTechnicalTagDto, ListTechnicalTagsQueryDto, UpdateTechnicalTagDto } from '../dto/technical-tag.dto';

@ApiTags('technical-tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('technical-tags')
export class TechnicalTagsController {
  constructor(
    private readonly createTechnicalTag: CreateTechnicalTagUseCase,
    private readonly listTechnicalTags: ListTechnicalTagsUseCase,
    private readonly getTechnicalTagDetails: GetTechnicalTagDetailsUseCase,
    private readonly updateTechnicalTag: UpdateTechnicalTagUseCase,
    private readonly archiveTechnicalTag: ArchiveTechnicalTagUseCase,
    private readonly deprecateTechnicalTag: DeprecateTechnicalTagUseCase,
  ) {}

  @Post()
  @RequirePermissions(permissions.knowledge.update)
  @ApiCreatedResponse({ description: 'Tag tecnica criada.' })
  async create(@Body() body: CreateTechnicalTagDto, @Req() request: AuthenticatedRequest): Promise<ApiResponse<TechnicalTagResponse>> {
    const result = await this.createTechnicalTag.execute({ ...body, organizationId: request.user.organizationId, createdBy: request.user.userId });
    if (result.isFail()) throw new BadRequestException(result.unwrapError().message);
    return ok(result.unwrap());
  }

  @Get()
  @RequirePermissions(permissions.knowledge.read)
  @ApiOkResponse({ description: 'Lista de tags tecnicas.' })
  async list(@Query() query: ListTechnicalTagsQueryDto, @Req() request: AuthenticatedRequest): Promise<ApiResponse<Paginated<TechnicalTagResponse>>> {
    return ok(await this.listTechnicalTags.execute({ ...query, organizationId: request.user.organizationId }));
  }

  @Get(':id')
  @RequirePermissions(permissions.knowledge.read)
  async detail(@Param('id') id: string, @Req() request: AuthenticatedRequest): Promise<ApiResponse<TechnicalTagResponse>> {
    const tag = await this.getTechnicalTagDetails.execute({ organizationId: request.user.organizationId, id });
    if (!tag) throw new NotFoundException('Technical tag not found.');
    return ok(tag);
  }

  @Patch(':id')
  @RequirePermissions(permissions.knowledge.update)
  async update(@Param('id') id: string, @Body() body: UpdateTechnicalTagDto, @Req() request: AuthenticatedRequest): Promise<ApiResponse<TechnicalTagResponse>> {
    const result = await this.updateTechnicalTag.execute({ ...body, id, organizationId: request.user.organizationId, updatedBy: request.user.userId });
    if (result.isFail()) {
      const message = result.unwrapError().message;
      if (message === 'Technical tag not found.') throw new NotFoundException(message);
      throw new BadRequestException(message);
    }
    return ok(result.unwrap());
  }

  @Post(':id/archive')
  @RequirePermissions(permissions.knowledge.archive)
  async archive(@Param('id') id: string, @Req() request: AuthenticatedRequest): Promise<ApiResponse<TechnicalTagResponse>> {
    const result = await this.archiveTechnicalTag.execute({ id, organizationId: request.user.organizationId, archivedBy: request.user.userId });
    if (result.isFail()) {
      const message = result.unwrapError().message;
      if (message === 'Technical tag not found.') throw new NotFoundException(message);
      throw new BadRequestException(message);
    }
    return ok(result.unwrap());
  }

  @Post(':id/deprecate')
  @RequirePermissions(permissions.knowledge.deprecate)
  async deprecate(@Param('id') id: string, @Req() request: AuthenticatedRequest): Promise<ApiResponse<TechnicalTagResponse>> {
    const result = await this.deprecateTechnicalTag.execute({ id, organizationId: request.user.organizationId, deprecatedBy: request.user.userId });
    if (result.isFail()) {
      const message = result.unwrapError().message;
      if (message === 'Technical tag not found.') throw new NotFoundException(message);
      throw new BadRequestException(message);
    }
    return ok(result.unwrap());
  }
}
