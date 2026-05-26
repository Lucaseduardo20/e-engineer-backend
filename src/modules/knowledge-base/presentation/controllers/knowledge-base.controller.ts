import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/infrastructure/auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import { ok } from '../../../../shared/presentation/api-response';
import { KnowledgeBaseQueryService } from '../../infrastructure/repositories/knowledge-base-query.service';
import { SearchKnowledgeBaseQueryDto } from '../dto/search-knowledge-base-query.dto';

@ApiTags('knowledge-base')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseQuery: KnowledgeBaseQueryService) {}

  @Get('search')
  @ApiOkResponse({ description: 'Busca projetos de referencia.' })
  async search(
    @Query() query: SearchKnowledgeBaseQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return ok(
      await this.knowledgeBaseQuery.search({
        organizationId: request.user.organizationId,
        q: query.q,
        page: query.page,
        pageSize: query.pageSize,
      }),
    );
  }
}
