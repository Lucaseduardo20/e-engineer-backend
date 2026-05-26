import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/infrastructure/auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import { ok } from '../../../../shared/presentation/api-response';
import { PaginationQueryDto } from '../../../../shared/presentation/pagination-query.dto';
import { DocumentQueryService } from '../../infrastructure/repositories/document-query.service';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentQuery: DocumentQueryService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista paginada de documentos tecnicos.' })
  async list(
    @Query() query: PaginationQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return ok(
      await this.documentQuery.list({
        organizationId: request.user.organizationId,
        page: query.page,
        pageSize: query.pageSize,
      }),
    );
  }
}
