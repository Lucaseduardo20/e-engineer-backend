import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../domain/repositories/document.repository';
import { DocumentStatus } from '../../domain/value-objects/document-status.value-object';
import { DocumentMapper } from '../../infrastructure/mappers/document.mapper';
import { S3StorageService } from '../../infrastructure/storage/s3-storage.service';
import { DocumentResponseDto } from '../../presentation/dto/document-response.dto';

export interface UploadDocumentVersionInput {
  organizationId: string;
  documentId: string;
  uploadedBy: string;
  fileName: string;
  contentType?: string;
  buffer: Buffer;
  revision?: string;
  isOfficial?: boolean;
  status?: string;
  notes?: string | null;
}

@Injectable()
export class UploadDocumentVersionUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: DocumentRepository,
    private readonly storage: S3StorageService,
  ) {}

  async execute(
    input: UploadDocumentVersionInput,
  ): Promise<Result<DocumentResponseDto, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const documentId = new UniqueEntityId(input.documentId);
      const document = await this.documentRepository.findById(
        documentId,
        organizationId,
      );

      if (!document) {
        throw new Error('Document not found.');
      }

      const filePath = await this.storage.upload({
        organizationId: organizationId.toString(),
        documentId: document.id,
        fileName: input.fileName,
        contentType: input.contentType,
        buffer: input.buffer,
      });
      const version = document.addVersion({
        revision: input.revision,
        fileName: input.fileName,
        filePath,
        uploadedBy: input.uploadedBy,
        isOfficial: input.isOfficial,
        status: input.status
          ? DocumentStatus.create(input.status)
          : document.status,
        notes: input.notes,
      });

      await this.documentRepository.addVersion(document, version);

      return Result.ok(DocumentMapper.toResponse(document));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
