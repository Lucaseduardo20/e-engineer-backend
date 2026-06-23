import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { permissions } from '../../../../shared/application/authorization/permissions';
import type { PriorityRequest } from '../../../../shared/contracts/dashboard.contracts';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import { JwtAuthGuard } from '../../../../shared/infrastructure/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../../shared/infrastructure/auth/permissions.guard';
import { RequirePermissions } from '../../../../shared/infrastructure/auth/require-permissions.decorator';
import {
  ok,
  type ApiResponse,
} from '../../../../shared/presentation/api-response';
import { CreatePriorityRequestUseCase } from '../../application/use-cases/create-priority-request.use-case';
import { DecidePriorityRequestUseCase } from '../../application/use-cases/decide-priority-request.use-case';
import { ListPriorityRequestsUseCase } from '../../application/use-cases/list-priority-requests.use-case';
import { CreatePriorityRequestDto } from '../dto/create-priority-request.dto';

@ApiTags('priority-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('priority-requests')
export class PriorityRequestsController {
  constructor(
    private readonly createPriorityRequestUseCase: CreatePriorityRequestUseCase,
    private readonly listPriorityRequestsUseCase: ListPriorityRequestsUseCase,
    private readonly decidePriorityRequestUseCase: DecidePriorityRequestUseCase,
  ) {}

  @Get()
  @RequirePermissions(permissions.priority.request)
  @ApiOkResponse({ description: 'Lista solicitacoes de prioridade do tenant.' })
  async list(
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<PriorityRequest[]>> {
    return ok(
      await this.listPriorityRequestsUseCase.execute({
        organizationId: request.user.organizationId,
      }),
    );
  }

  @Post()
  @RequirePermissions(permissions.priority.request)
  @ApiOkResponse({ description: 'Cria solicitacao de prioridade.' })
  async create(
    @Body() body: CreatePriorityRequestDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<PriorityRequest>> {
    const result = await this.createPriorityRequestUseCase.execute({
      organizationId: request.user.organizationId,
      requestedBy: request.user.userId,
      actorRoles: request.user.roles,
      actorIsPlatformAdmin: request.user.isPlatformAdmin,
      targetType: body.targetType,
      targetId: body.targetId,
      requestedForUserId: body.requestedForUserId,
      priority: body.priority,
      reason: body.reason,
    });

    if (result.isFail()) {
      throw new BadRequestException(result.unwrapError().message);
    }

    return ok(result.unwrap());
  }

  @Post(':id/apply')
  @RequirePermissions(permissions.priority.apply)
  @ApiOkResponse({ description: 'Aplica uma solicitacao de prioridade.' })
  async apply(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<PriorityRequest>> {
    return this.decide(id, 'apply', request);
  }

  @Post(':id/reject')
  @RequirePermissions(permissions.priority.apply)
  @ApiOkResponse({ description: 'Rejeita uma solicitacao de prioridade.' })
  async reject(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<PriorityRequest>> {
    return this.decide(id, 'reject', request);
  }

  private async decide(
    priorityRequestId: string,
    decision: 'apply' | 'reject',
    request: AuthenticatedRequest,
  ): Promise<ApiResponse<PriorityRequest>> {
    const result = await this.decidePriorityRequestUseCase.execute({
      organizationId: request.user.organizationId,
      priorityRequestId,
      decidedBy: request.user.userId,
      decision,
    });

    if (result.isFail()) {
      throw new BadRequestException(result.unwrapError().message);
    }

    return ok(result.unwrap());
  }
}
