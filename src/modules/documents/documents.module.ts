import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedInfrastructureModule } from '../../shared/infrastructure/shared-infrastructure.module';
import { AuditModule } from '../audit/audit.module';
import { KNOWLEDGE_ITEM_REPOSITORY } from '../knowledge-base/domain/repositories/knowledge-item.repository';
import { TypeOrmKnowledgeItemRepository } from '../knowledge-base/infrastructure/repositories/knowledge-item.repository';
import { KnowledgeAttachmentOrmEntity } from '../knowledge-base/infrastructure/persistence/typeorm/knowledge-attachment.orm-entity';
import { KnowledgeItemOrmEntity } from '../knowledge-base/infrastructure/persistence/typeorm/knowledge-item.orm-entity';
import { KnowledgeRelationOrmEntity } from '../knowledge-base/infrastructure/persistence/typeorm/knowledge-relation.orm-entity';
import { KnowledgeItemTagOrmEntity } from '../knowledge-base/infrastructure/persistence/typeorm/knowledge-item-tag.orm-entity';
import { TechnicalTagOrmEntity } from '../technical-taxonomy/infrastructure/persistence/typeorm/technical-tag.orm-entity';
import { DeliverableOrmEntity } from '../deliverables/infrastructure/persistence/typeorm/deliverable.orm-entity';
import { ProjectOrmEntity } from '../projects/infrastructure/persistence/typeorm/project.orm-entity';
import { CreateDocumentUseCase } from './application/use-cases/create-document.use-case';
import { DeleteDocumentUseCase } from './application/use-cases/delete-document.use-case';
import { GetDocumentUseCase } from './application/use-cases/get-document.use-case';
import { ListDocumentsUseCase } from './application/use-cases/list-documents.use-case';
import { UpdateDocumentUseCase } from './application/use-cases/update-document.use-case';
import { UploadDocumentVersionUseCase } from './application/use-cases/upload-document-version.use-case';
import { DOCUMENT_REPOSITORY } from './domain/repositories/document.repository';
import { DocumentOrmEntity } from './infrastructure/persistence/typeorm/document.orm-entity';
import { DocumentVersionOrmEntity } from './infrastructure/persistence/typeorm/document-version.orm-entity';
import { TypeOrmDocumentRepository } from './infrastructure/repositories/document.repository';
import { S3StorageService } from './infrastructure/storage/s3-storage.service';
import { DocumentsController } from './presentation/controllers/documents.controller';
import { SaveDocumentAsKnowledgeModelUseCase } from './application/use-cases/save-document-as-knowledge-model.use-case';

@Module({
  imports: [
    SharedInfrastructureModule,
    TypeOrmModule.forFeature([
      DocumentOrmEntity,
      DocumentVersionOrmEntity,
      ProjectOrmEntity,
      DeliverableOrmEntity,
      KnowledgeItemOrmEntity,
      KnowledgeRelationOrmEntity,
      KnowledgeAttachmentOrmEntity,
      KnowledgeItemTagOrmEntity,
      TechnicalTagOrmEntity,
    ]),
    AuditModule,
  ],
  controllers: [DocumentsController],
  providers: [
    CreateDocumentUseCase,
    ListDocumentsUseCase,
    GetDocumentUseCase,
    UpdateDocumentUseCase,
    DeleteDocumentUseCase,
    UploadDocumentVersionUseCase,
    SaveDocumentAsKnowledgeModelUseCase,
    S3StorageService,
    {
      provide: DOCUMENT_REPOSITORY,
      useClass: TypeOrmDocumentRepository,
    },
    {
      provide: KNOWLEDGE_ITEM_REPOSITORY,
      useClass: TypeOrmKnowledgeItemRepository,
    },
  ],
})
export class DocumentsModule {}
