import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentQueryService } from './infrastructure/repositories/document-query.service';
import { DocumentOrmEntity } from './infrastructure/persistence/typeorm/document.orm-entity';
import { DocumentVersionOrmEntity } from './infrastructure/persistence/typeorm/document-version.orm-entity';
import { DocumentsController } from './presentation/controllers/documents.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentOrmEntity, DocumentVersionOrmEntity]),
  ],
  controllers: [DocumentsController],
  providers: [DocumentQueryService],
})
export class DocumentsModule {}
