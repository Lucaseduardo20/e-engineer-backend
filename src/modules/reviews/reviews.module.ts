import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { DeliverableOrmEntity } from '../deliverables/infrastructure/persistence/typeorm/deliverable.orm-entity';
import { DocumentVersionOrmEntity } from '../documents/infrastructure/persistence/typeorm/document-version.orm-entity';
import { DocumentOrmEntity } from '../documents/infrastructure/persistence/typeorm/document.orm-entity';
import { UserOrmEntity } from '../identity/infrastructure/persistence/typeorm/user.orm-entity';
import { KNOWLEDGE_ITEM_REPOSITORY } from '../knowledge-base/domain/repositories/knowledge-item.repository';
import { KnowledgeAttachmentOrmEntity } from '../knowledge-base/infrastructure/persistence/typeorm/knowledge-attachment.orm-entity';
import { KnowledgeItemOrmEntity } from '../knowledge-base/infrastructure/persistence/typeorm/knowledge-item.orm-entity';
import { KnowledgeRelationOrmEntity } from '../knowledge-base/infrastructure/persistence/typeorm/knowledge-relation.orm-entity';
import { TypeOrmKnowledgeItemRepository } from '../knowledge-base/infrastructure/repositories/knowledge-item.repository';
import { ProjectOrmEntity } from '../projects/infrastructure/persistence/typeorm/project.orm-entity';
import { AddReviewCommentUseCase } from './application/use-cases/add-review-comment.use-case';
import { ApproveReviewUseCase } from './application/use-cases/approve-review.use-case';
import { CreateReviewUseCase } from './application/use-cases/create-review.use-case';
import { GetReviewUseCase } from './application/use-cases/get-review.use-case';
import { ListReviewsUseCase } from './application/use-cases/list-reviews.use-case';
import { RejectReviewUseCase } from './application/use-cases/reject-review.use-case';
import { RegisterReviewAsLessonLearnedUseCase } from './application/use-cases/register-review-as-lesson-learned.use-case';
import { REVIEW_REPOSITORY } from './domain/repositories/review.repository';
import { REVIEW_COMMENT_REPOSITORY } from './domain/repositories/review-comment.repository';
import { ReviewCommentOrmEntity } from './infrastructure/persistence/typeorm/review-comment.orm-entity';
import { ReviewOrmEntity } from './infrastructure/persistence/typeorm/review.orm-entity';
import { TypeOrmReviewCommentRepository } from './infrastructure/repositories/review-comment.repository';
import { TypeOrmReviewRepository } from './infrastructure/repositories/review.repository';
import { ReviewsController } from './presentation/controllers/reviews.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReviewOrmEntity,
      ReviewCommentOrmEntity,
      ProjectOrmEntity,
      DeliverableOrmEntity,
      DocumentOrmEntity,
      DocumentVersionOrmEntity,
      UserOrmEntity,
      KnowledgeItemOrmEntity,
      KnowledgeRelationOrmEntity,
      KnowledgeAttachmentOrmEntity,
    ]),
    AuditModule,
  ],
  controllers: [ReviewsController],
  providers: [
    CreateReviewUseCase,
    ListReviewsUseCase,
    GetReviewUseCase,
    ApproveReviewUseCase,
    RejectReviewUseCase,
    AddReviewCommentUseCase,
    RegisterReviewAsLessonLearnedUseCase,
    {
      provide: REVIEW_REPOSITORY,
      useClass: TypeOrmReviewRepository,
    },
    {
      provide: REVIEW_COMMENT_REPOSITORY,
      useClass: TypeOrmReviewCommentRepository,
    },
    {
      provide: KNOWLEDGE_ITEM_REPOSITORY,
      useClass: TypeOrmKnowledgeItemRepository,
    },
  ],
})
export class ReviewsModule {}
