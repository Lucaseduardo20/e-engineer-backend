import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedInfrastructureModule } from '../../shared/infrastructure/shared-infrastructure.module';
import { AuditModule } from '../audit/audit.module';
import { CreateProjectFromBaseProjectUseCase } from './application/use-cases/create-project-from-base-project.use-case';
import { CreateProjectUseCase } from './application/use-cases/create-project.use-case';
import { GetProjectDetailUseCase } from './application/use-cases/get-project-detail.use-case';
import { GetProjectTechnicalProfileUseCase } from './application/use-cases/get-project-technical-profile.use-case';
import { ListProjectsUseCase } from './application/use-cases/list-projects.use-case';
import { ProjectTechnicalProfileScoreService } from './application/services/project-technical-profile-score.service';
import { UpdateProjectUseCase } from './application/use-cases/update-project.use-case';
import { UpdateProjectStatusUseCase } from './application/use-cases/update-project-status.use-case';
import { ListProjectKnowledgeItemsUseCase } from './application/use-cases/list-project-knowledge-items.use-case';
import { LinkKnowledgeItemToProjectUseCase } from './application/use-cases/link-knowledge-item-to-project.use-case';
import { UnlinkKnowledgeItemFromProjectUseCase } from './application/use-cases/unlink-knowledge-item-from-project.use-case';
import { RecommendKnowledgeForProjectUseCase } from './application/use-cases/recommend-knowledge-for-project.use-case';
import { RecommendProjectBasesByTagsUseCase } from './application/use-cases/recommend-project-bases-by-tags.use-case';
import { RecommendSimilarProjectsUseCase } from './application/use-cases/recommend-similar-projects.use-case';
import { PROJECT_BASE_STRUCTURE_REPOSITORY } from './application/ports/project-base-structure.repository';
import { TypeOrmProjectBaseStructureRepository } from './infrastructure/repositories/typeorm-project-base-structure.repository';
import { KNOWLEDGE_ITEM_REPOSITORY } from '../knowledge-base/domain/repositories/knowledge-item.repository';
import { TypeOrmKnowledgeItemRepository } from '../knowledge-base/infrastructure/repositories/knowledge-item.repository';
import { KnowledgeItemOrmEntity } from '../knowledge-base/infrastructure/persistence/typeorm/knowledge-item.orm-entity';
import { KnowledgeRelationOrmEntity } from '../knowledge-base/infrastructure/persistence/typeorm/knowledge-relation.orm-entity';
import { KnowledgeAttachmentOrmEntity } from '../knowledge-base/infrastructure/persistence/typeorm/knowledge-attachment.orm-entity';
import { KnowledgeItemTagOrmEntity } from '../knowledge-base/infrastructure/persistence/typeorm/knowledge-item-tag.orm-entity';
import { TechnicalTagOrmEntity } from '../technical-taxonomy/infrastructure/persistence/typeorm/technical-tag.orm-entity';
import { PROJECT_REPOSITORY } from './domain/repositories/project.repository';
import { ProjectBaseRelationOrmEntity } from './infrastructure/persistence/typeorm/project-base-relation.orm-entity';
import { DeliverableBaseRelationOrmEntity } from './infrastructure/persistence/typeorm/deliverable-base-relation.orm-entity';
import { ProjectTagOrmEntity } from './infrastructure/persistence/typeorm/project-tag.orm-entity';
import { ProjectOrmEntity } from './infrastructure/persistence/typeorm/project.orm-entity';
import { TypeOrmProjectRepository } from './infrastructure/persistence/typeorm/typeorm-project.repository';
import { ProjectsController } from './presentation/controllers/projects.controller';
import { DeliverableOrmEntity } from '../deliverables/infrastructure/persistence/typeorm/deliverable.orm-entity';
import { DELIVERABLE_REPOSITORY } from '../deliverables/domain/repositories/deliverable.repository';
import { TypeOrmDeliverableRepository } from '../deliverables/infrastructure/repositories/deliverable.repository';
import { DeliverableTagOrmEntity } from '../deliverables/infrastructure/persistence/typeorm/deliverable-tag.orm-entity';
import { DeliverableRemovalRequestOrmEntity } from '../deliverables/infrastructure/persistence/typeorm/deliverable-removal-request.orm-entity';
import { DocumentOrmEntity } from '../documents/infrastructure/persistence/typeorm/document.orm-entity';
import { DocumentVersionOrmEntity } from '../documents/infrastructure/persistence/typeorm/document-version.orm-entity';
import { ReviewOrmEntity } from '../reviews/infrastructure/persistence/typeorm/review.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectOrmEntity,
      ProjectBaseRelationOrmEntity,
      DeliverableBaseRelationOrmEntity,
      ProjectTagOrmEntity,
      KnowledgeItemOrmEntity,
      KnowledgeRelationOrmEntity,
      KnowledgeAttachmentOrmEntity,
      KnowledgeItemTagOrmEntity,
      TechnicalTagOrmEntity,
      DeliverableOrmEntity,
      DeliverableTagOrmEntity,
      DeliverableRemovalRequestOrmEntity,
      DocumentOrmEntity,
      DocumentVersionOrmEntity,
      ReviewOrmEntity,
    ]),
    SharedInfrastructureModule,
    AuditModule,
  ],
  controllers: [ProjectsController],
  providers: [
    CreateProjectUseCase,
    CreateProjectFromBaseProjectUseCase,
    GetProjectDetailUseCase,
    GetProjectTechnicalProfileUseCase,
    ListProjectsUseCase,
    ProjectTechnicalProfileScoreService,
    UpdateProjectUseCase,
    UpdateProjectStatusUseCase,
    ListProjectKnowledgeItemsUseCase,
    LinkKnowledgeItemToProjectUseCase,
    UnlinkKnowledgeItemFromProjectUseCase,
    RecommendKnowledgeForProjectUseCase,
    RecommendProjectBasesByTagsUseCase,
    RecommendSimilarProjectsUseCase,
    {
      provide: PROJECT_REPOSITORY,
      useClass: TypeOrmProjectRepository,
    },
    {
      provide: KNOWLEDGE_ITEM_REPOSITORY,
      useClass: TypeOrmKnowledgeItemRepository,
    },
    {
      provide: DELIVERABLE_REPOSITORY,
      useClass: TypeOrmDeliverableRepository,
    },
    {
      provide: PROJECT_BASE_STRUCTURE_REPOSITORY,
      useClass: TypeOrmProjectBaseStructureRepository,
    },
  ],
})
export class ProjectsModule {}
