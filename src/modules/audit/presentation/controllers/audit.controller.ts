import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/infrastructure/auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import { ok } from '../../../../shared/presentation/api-response';
import { PaginationQueryDto } from '../../../../shared/presentation/pagination-query.dto';
import { AuditQueryService } from '../../infrastructure/repositories/audit-query.service';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditQuery: AuditQueryService) {}

  @Get()
  @ApiOkResponse({ description: 'Historico auditavel da organizacao.' })
  async list(
    @Query() query: PaginationQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return ok(
      await this.auditQuery.list({
        organizationId: request.user.organizationId,
        page: query.page,
        pageSize: query.pageSize,
      }),
    );
  }
}
