import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/infrastructure/auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import { ok } from '../../../../shared/presentation/api-response';
import { DeliverableQueryService } from '../../infrastructure/repositories/deliverable-query.service';
import { ListDeliverablesQueryDto } from '../dto/list-deliverables-query.dto';

@ApiTags('deliverables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deliverables')
export class DeliverablesController {
  constructor(private readonly deliverableQuery: DeliverableQueryService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista paginada de entregaveis.' })
  async list(
    @Query() query: ListDeliverablesQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return ok(
      await this.deliverableQuery.list({
        organizationId: request.user.organizationId,
        projectId: query.projectId,
        page: query.page,
        pageSize: query.pageSize,
      }),
    );
  }
}
