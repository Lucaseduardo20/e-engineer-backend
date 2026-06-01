import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedInfrastructureModule } from '../../shared/infrastructure/shared-infrastructure.module';
import { AuditModule } from '../audit/audit.module';
import { CreateProjectUseCase } from './application/use-cases/create-project.use-case';
import { GetProjectDetailUseCase } from './application/use-cases/get-project-detail.use-case';
import { ListProjectsUseCase } from './application/use-cases/list-projects.use-case';
import { UpdateProjectStatusUseCase } from './application/use-cases/update-project-status.use-case';
import { ListProjectKnowledgeItemsUseCase } from './application/use-cases/list-project-knowledge-items.use-case';
import { LinkKnowledgeItemToProjectUseCase } from './application/use-cases/link-knowledge-item-to-project.use-case';
import { UnlinkKnowledgeItemFromProjectUseCase } from './application/use-cases/unlink-knowledge-item-from-project.use-case';
import { KNOWLEDGE_ITEM_REPOSITORY } from '../knowledge-base/domain/repositories/knowledge-item.repository';
import { TypeOrmKnowledgeItemRepository } from '../knowledge-base/infrastructure/repositories/knowledge-item.repository';
import { KnowledgeItemOrmEntity } from '../knowledge-base/infrastructure/persistence/typeorm/knowledge-item.orm-entity';
import { KnowledgeRelationOrmEntity } from '../knowledge-base/infrastructure/persistence/typeorm/knowledge-relation.orm-entity';
import { KnowledgeAttachmentOrmEntity } from '../knowledge-base/infrastructure/persistence/typeorm/knowledge-attachment.orm-entity';
import { PROJECT_REPOSITORY } from './domain/repositories/project.repository';
import { ProjectOrmEntity } from './infrastructure/persistence/typeorm/project.orm-entity';
import { TypeOrmProjectRepository } from './infrastructure/persistence/typeorm/typeorm-project.repository';
import { ProjectsController } from './presentation/controllers/projects.controller';
import { DeliverableOrmEntity } from '../deliverables/infrastructure/persistence/typeorm/deliverable.orm-entity';
import { DocumentOrmEntity } from '../documents/infrastructure/persistence/typeorm/document.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectOrmEntity,
      KnowledgeItemOrmEntity,
      KnowledgeRelationOrmEntity,
      KnowledgeAttachmentOrmEntity,
      DeliverableOrmEntity,
      DocumentOrmEntity,
    ]),
    SharedInfrastructureModule,
    AuditModule,
  ],
  controllers: [ProjectsController],
  providers: [
    CreateProjectUseCase,
    GetProjectDetailUseCase,
    ListProjectsUseCase,
    UpdateProjectStatusUseCase,
    ListProjectKnowledgeItemsUseCase,
    LinkKnowledgeItemToProjectUseCase,
    UnlinkKnowledgeItemFromProjectUseCase,
    {
      provide: PROJECT_REPOSITORY,
      useClass: TypeOrmProjectRepository,
    },
    {
      provide: KNOWLEDGE_ITEM_REPOSITORY,
      useClass: TypeOrmKnowledgeItemRepository,
    },
  ],
})
export class ProjectsModule {}
