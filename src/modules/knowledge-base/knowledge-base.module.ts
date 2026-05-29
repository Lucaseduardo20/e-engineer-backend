import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedInfrastructureModule } from '../../shared/infrastructure/shared-infrastructure.module';
import { DeliverableOrmEntity } from '../deliverables/infrastructure/persistence/typeorm/deliverable.orm-entity';
import { DocumentOrmEntity } from '../documents/infrastructure/persistence/typeorm/document.orm-entity';
import { ProjectOrmEntity } from '../projects/infrastructure/persistence/typeorm/project.orm-entity';
import { ArchiveKnowledgeItemUseCase } from './application/use-cases/archive-knowledge-item.use-case';
import { CreateKnowledgeItemUseCase } from './application/use-cases/create-knowledge-item.use-case';
import { GetKnowledgeItemDetailsUseCase } from './application/use-cases/get-knowledge-item-details.use-case';
import { LinkKnowledgeItemUseCase } from './application/use-cases/link-knowledge-item.use-case';
import { ListKnowledgeItemsUseCase } from './application/use-cases/list-knowledge-items.use-case';
import { PromoteProjectToKnowledgeUseCase } from './application/use-cases/promote-project-to-knowledge.use-case';
import { PublishKnowledgeItemUseCase } from './application/use-cases/publish-knowledge-item.use-case';
import { SearchKnowledgeItemsUseCase } from './application/use-cases/search-knowledge-items.use-case';
import { UpdateKnowledgeItemUseCase } from './application/use-cases/update-knowledge-item.use-case';
import { UseKnowledgeItemInProjectUseCase } from './application/use-cases/use-knowledge-item-in-project.use-case';
import { KNOWLEDGE_ITEM_REPOSITORY } from './domain/repositories/knowledge-item.repository';
import { KnowledgeAttachmentOrmEntity } from './infrastructure/persistence/typeorm/knowledge-attachment.orm-entity';
import { KnowledgeItemOrmEntity } from './infrastructure/persistence/typeorm/knowledge-item.orm-entity';
import { KnowledgeRelationOrmEntity } from './infrastructure/persistence/typeorm/knowledge-relation.orm-entity';
import { TypeOrmKnowledgeItemRepository } from './infrastructure/repositories/knowledge-item.repository';
import { KnowledgeBaseController } from './presentation/controllers/knowledge-base.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KnowledgeItemOrmEntity,
      KnowledgeRelationOrmEntity,
      KnowledgeAttachmentOrmEntity,
      ProjectOrmEntity,
      DeliverableOrmEntity,
      DocumentOrmEntity,
    ]),
    SharedInfrastructureModule,
  ],
  controllers: [KnowledgeBaseController],
  providers: [
    CreateKnowledgeItemUseCase,
    UpdateKnowledgeItemUseCase,
    PublishKnowledgeItemUseCase,
    ArchiveKnowledgeItemUseCase,
    ListKnowledgeItemsUseCase,
    SearchKnowledgeItemsUseCase,
    GetKnowledgeItemDetailsUseCase,
    LinkKnowledgeItemUseCase,
    PromoteProjectToKnowledgeUseCase,
    UseKnowledgeItemInProjectUseCase,
    {
      provide: KNOWLEDGE_ITEM_REPOSITORY,
      useClass: TypeOrmKnowledgeItemRepository,
    },
  ],
})
export class KnowledgeBaseModule {}
