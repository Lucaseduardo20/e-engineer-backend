import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/infrastructure/auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import { ok } from '../../../../shared/presentation/api-response';
import { PaginationQueryDto } from '../../../../shared/presentation/pagination-query.dto';
import { ReviewQueryService } from '../../infrastructure/repositories/review-query.service';

@ApiTags('reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewQuery: ReviewQueryService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista paginada de revisoes tecnicas.' })
  async list(
    @Query() query: PaginationQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return ok(
      await this.reviewQuery.list({
        organizationId: request.user.organizationId,
        page: query.page,
        pageSize: query.pageSize,
      }),
    );
  }
}
