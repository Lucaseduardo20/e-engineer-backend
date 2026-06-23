import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
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
import type {
  Paginated,
  ReviewDetail,
  ReviewSummary,
  ReviewComment,
} from '../../../../shared/contracts/dashboard.contracts';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import { JwtAuthGuard } from '../../../../shared/infrastructure/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../../shared/infrastructure/auth/permissions.guard';
import { RequirePermissions } from '../../../../shared/infrastructure/auth/require-permissions.decorator';
import { permissions } from '../../../../shared/application/authorization/permissions';
import {
  ok,
  type ApiResponse,
} from '../../../../shared/presentation/api-response';
import { AuditQueryService } from '../../../audit/infrastructure/repositories/audit-query.service';
import { ApproveReviewUseCase } from '../../application/use-cases/approve-review.use-case';
import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case';
import { GetReviewUseCase } from '../../application/use-cases/get-review.use-case';
import { ListReviewsUseCase } from '../../application/use-cases/list-reviews.use-case';
import { RejectReviewUseCase } from '../../application/use-cases/reject-review.use-case';
import { AddReviewCommentUseCase } from '../../application/use-cases/add-review-comment.use-case';
import { CreateReviewCommentDto } from '../dto/create-review-comment.dto';
import { CreateReviewDto } from '../dto/create-review.dto';
import { DecideReviewDto } from '../dto/decide-review.dto';
import { ListReviewsQueryDto } from '../dto/list-reviews-query.dto';
import { ReviewResponseDto } from '../dto/review-response.dto';
import { RegisterReviewAsLessonLearnedUseCase } from '../../application/use-cases/register-review-as-lesson-learned.use-case';
import { RegisterReviewLessonDto } from '../dto/register-review-lesson.dto';

@ApiTags('reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly createReviewUseCase: CreateReviewUseCase,
    private readonly listReviewsUseCase: ListReviewsUseCase,
    private readonly getReviewUseCase: GetReviewUseCase,
    private readonly approveReviewUseCase: ApproveReviewUseCase,
    private readonly rejectReviewUseCase: RejectReviewUseCase,
    private readonly addReviewCommentUseCase: AddReviewCommentUseCase,
    private readonly registerReviewAsLessonLearnedUseCase: RegisterReviewAsLessonLearnedUseCase,
    private readonly audit: AuditQueryService,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Lista paginada de revisoes tecnicas.' })
  async list(
    @Query() query: ListReviewsQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<Paginated<ReviewSummary>>> {
    return ok(
      await this.listReviewsUseCase.execute({
        organizationId: request.user.organizationId,
        page: query.page,
        pageSize: query.pageSize,
        projectId: query.projectId,
        deliverableId: query.deliverableId,
        documentId: query.documentId,
        status: query.status,
      }),
    );
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalhe de uma revisao tecnica.' })
  async detail(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<ReviewDetail>> {
    const review = await this.getReviewUseCase.execute({
      organizationId: request.user.organizationId,
      reviewId: id,
    });

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    return ok(review);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Solicitacao de revisao criada.' })
  async create(
    @Body() body: CreateReviewDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<ReviewResponseDto>> {
    const result = await this.createReviewUseCase.execute({
      ...body,
      organizationId: request.user.organizationId,
      requestedBy: request.user.userId,
    });

    if (result.isFail()) {
      this.throwResultError(result.unwrapError());
    }

    return ok(result.unwrap());
  }

  @Post(':id/approve')
  @ApiOkResponse({ description: 'Revisao aprovada.' })
  async approve(
    @Param('id') id: string,
    @Body() body: DecideReviewDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<ReviewResponseDto>> {
    const result = await this.approveReviewUseCase.execute({
      organizationId: request.user.organizationId,
      reviewId: id,
      actorUserId: request.user.userId,
      comment: body.comment,
    });

    if (result.isFail()) {
      this.throwResultError(result.unwrapError());
    }

    const review = result.unwrap();
    await this.audit.record({
      organizationId: request.user.organizationId,
      actorName: request.user.userId,
      action: 'review.approved',
      entityType: 'review',
      entityId: review.id,
      description: 'Revisao tecnica aprovada',
      metadata: { projectId: review.projectId, comment: body.comment ?? null },
    });

    return ok(review);
  }

  @Post(':id/reject')
  @ApiOkResponse({ description: 'Revisao rejeitada.' })
  async reject(
    @Param('id') id: string,
    @Body() body: DecideReviewDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<ReviewResponseDto>> {
    const result = await this.rejectReviewUseCase.execute({
      organizationId: request.user.organizationId,
      reviewId: id,
      actorUserId: request.user.userId,
      comment: body.comment,
    });

    if (result.isFail()) {
      this.throwResultError(result.unwrapError());
    }

    const review = result.unwrap();
    await this.audit.record({
      organizationId: request.user.organizationId,
      actorName: request.user.userId,
      action: 'review.rejected',
      entityType: 'review',
      entityId: review.id,
      description: 'Revisao tecnica rejeitada',
      metadata: { projectId: review.projectId, comment: body.comment ?? null },
    });

    return ok(review);
  }

  @Post(':id/comments')
  @ApiCreatedResponse({ description: 'Comentario adicionado a revisao.' })
  async addComment(
    @Param('id') id: string,
    @Body() body: CreateReviewCommentDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<ReviewComment>> {
    const result = await this.addReviewCommentUseCase.execute({
      organizationId: request.user.organizationId,
      reviewId: id,
      actorUserId: request.user.userId,
      body: body.body,
    });

    if (result.isFail()) {
      this.throwResultError(result.unwrapError());
    }

    const comment = result.unwrap();
    await this.audit.record({
      organizationId: request.user.organizationId,
      actorName: request.user.userId,
      action: 'review.comment.created',
      entityType: 'review',
      entityId: id,
      description: 'Comentario registrado em revisao tecnica',
      metadata: { commentId: comment.id },
    });

    return ok(comment);
  }

  @Post(':id/register-lesson-learned')
  @RequirePermissions(permissions.knowledge.registerLesson)
  @ApiCreatedResponse({ description: 'Licao aprendida registrada a partir da revisao.' })
  async registerLessonLearned(
    @Param('id') id: string,
    @Body() body: RegisterReviewLessonDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.registerReviewAsLessonLearnedUseCase.execute({
      ...body,
      organizationId: request.user.organizationId,
      reviewId: id,
      createdBy: request.user.userId,
    });
    if (result.isFail()) this.throwResultError(result.unwrapError());
    return ok(result.unwrap());
  }

  private throwResultError(error: Error): never {
    if (error.message.endsWith('not found.')) {
      throw new NotFoundException(error.message);
    }

    if (error.message.includes('not authorized')) {
      throw new ForbiddenException(error.message);
    }

    throw new BadRequestException(error.message);
  }
}
