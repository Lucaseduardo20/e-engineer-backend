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
import { JwtAuthGuard } from '../../../../shared/infrastructure/auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import {
  ok,
  type ApiResponse,
} from '../../../../shared/presentation/api-response';
import type {
  Deliverable,
  Paginated,
} from '../../../../shared/contracts/dashboard.contracts';
import { CreateDeliverableUseCase } from '../../application/use-cases/create-deliverable.use-case';
import { DecideDeliverableRemovalUseCase } from '../../application/use-cases/decide-deliverable-removal.use-case';
import { GetDeliverableUseCase } from '../../application/use-cases/get-deliverable.use-case';
import { ListDeliverablesUseCase } from '../../application/use-cases/list-deliverables.use-case';
import { MarkDeliverableInheritanceReviewedUseCase } from '../../application/use-cases/mark-deliverable-inheritance-reviewed.use-case';
import { RequestDeliverableRemovalUseCase } from '../../application/use-cases/request-deliverable-removal.use-case';
import { UpdateDeliverableUseCase } from '../../application/use-cases/update-deliverable.use-case';
import { CreateDeliverableDto } from '../dto/create-deliverable.dto';
import { DecideDeliverableRemovalDto } from '../dto/decide-deliverable-removal.dto';
import { ListDeliverablesQueryDto } from '../dto/list-deliverables-query.dto';
import { RequestDeliverableRemovalDto } from '../dto/request-deliverable-removal.dto';
import { UpdateDeliverableDto } from '../dto/update-deliverable.dto';
import { DeliverableResponseDto } from '../dto/deliverable-response.dto';

@ApiTags('deliverables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deliverables')
export class DeliverablesController {
  constructor(
    private readonly createDeliverableUseCase: CreateDeliverableUseCase,
    private readonly listDeliverablesUseCase: ListDeliverablesUseCase,
    private readonly getDeliverableUseCase: GetDeliverableUseCase,
    private readonly updateDeliverableUseCase: UpdateDeliverableUseCase,
    private readonly markDeliverableInheritanceReviewedUseCase: MarkDeliverableInheritanceReviewedUseCase,
    private readonly requestDeliverableRemovalUseCase: RequestDeliverableRemovalUseCase,
    private readonly decideDeliverableRemovalUseCase: DecideDeliverableRemovalUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Lista paginada de entregaveis.' })
  async list(
    @Query() query: ListDeliverablesQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<Paginated<Deliverable>>> {
    return ok(
      await this.listDeliverablesUseCase.execute({
        organizationId: request.user.organizationId,
        projectId: query.projectId,
        page: query.page,
        pageSize: query.pageSize,
        status: query.status,
      }),
    );
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalhe de um entregavel.' })
  async detail(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<Deliverable>> {
    const deliverable = await this.getDeliverableUseCase.execute({
      organizationId: request.user.organizationId,
      deliverableId: id,
    });

    if (!deliverable) {
      throw new NotFoundException('Deliverable not found.');
    }

    return ok(deliverable);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Entregavel criado.' })
  async create(
    @Body() body: CreateDeliverableDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<DeliverableResponseDto>> {
    const result = await this.createDeliverableUseCase.execute({
      ...body,
      organizationId: request.user.organizationId,
      createdBy: request.user.userId,
    });

    if (result.isFail()) {
      throw new BadRequestException(result.unwrapError().message);
    }

    return ok(result.unwrap());
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Entregavel atualizado.' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateDeliverableDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<DeliverableResponseDto>> {
    const result = await this.updateDeliverableUseCase.execute({
      ...body,
      organizationId: request.user.organizationId,
      deliverableId: id,
      updatedBy: request.user.userId,
    });

    if (result.isFail()) {
      const error = result.unwrapError();

      if (error.message === 'Deliverable not found.') {
        throw new NotFoundException(error.message);
      }

      throw new BadRequestException(error.message);
    }

    return ok(result.unwrap());
  }

  @Post(':id/inheritance-review/mark-reviewed')
  @ApiOkResponse({ description: 'Entregavel herdado marcado como revisado.' })
  async markInheritanceReviewed(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<Deliverable>> {
    const result = await this.markDeliverableInheritanceReviewedUseCase.execute({
      organizationId: request.user.organizationId,
      deliverableId: id,
      reviewedBy: request.user.userId,
    });

    if (result.isFail()) {
      const error = result.unwrapError();

      if (error.message === 'Inherited deliverable not found.') {
        throw new NotFoundException(error.message);
      }

      throw new BadRequestException(error.message);
    }

    return ok(result.unwrap());
  }

  @Post(':id/removal-requests')
  @ApiOkResponse({ description: 'Solicitacao de remocao de entregavel.' })
  async requestRemoval(
    @Param('id') id: string,
    @Body() body: RequestDeliverableRemovalDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.requestDeliverableRemovalUseCase.execute({
      organizationId: request.user.organizationId,
      deliverableId: id,
      requestedBy: request.user.userId,
      actorRoles: request.user.roles,
      actorIsPlatformAdmin: request.user.isPlatformAdmin,
      reason: body.reason,
    });

    if (result.isFail()) {
      const error = result.unwrapError();

      if (error.message === 'Deliverable not found.') {
        throw new NotFoundException(error.message);
      }

      throw new BadRequestException(error.message);
    }

    return ok(result.unwrap());
  }

  @Post('removal-requests/:requestId/approve')
  @ApiOkResponse({ description: 'Solicitacao de remocao aprovada.' })
  async approveRemoval(
    @Param('requestId') requestId: string,
    @Body() body: DecideDeliverableRemovalDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<unknown>> {
    return this.decideRemoval(requestId, 'approve', body, request);
  }

  @Post('removal-requests/:requestId/reject')
  @ApiOkResponse({ description: 'Solicitacao de remocao rejeitada.' })
  async rejectRemoval(
    @Param('requestId') requestId: string,
    @Body() body: DecideDeliverableRemovalDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<unknown>> {
    return this.decideRemoval(requestId, 'reject', body, request);
  }

  private async decideRemoval(
    requestId: string,
    decision: 'approve' | 'reject',
    body: DecideDeliverableRemovalDto,
    request: AuthenticatedRequest,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.decideDeliverableRemovalUseCase.execute({
      organizationId: request.user.organizationId,
      requestId,
      decidedBy: request.user.userId,
      actorRoles: request.user.roles,
      actorIsPlatformAdmin: request.user.isPlatformAdmin,
      decision,
      comment: body.comment,
    });

    if (result.isFail()) {
      const error = result.unwrapError();

      if (error.message === 'Removal request not found.') {
        throw new NotFoundException(error.message);
      }

      throw new BadRequestException(error.message);
    }

    return ok(result.unwrap());
  }
}
