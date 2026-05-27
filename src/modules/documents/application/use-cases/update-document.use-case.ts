import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../domain/repositories/document.repository';
import { DocumentStatus } from '../../domain/value-objects/document-status.value-object';
import { DocumentType } from '../../domain/value-objects/document-type.value-object';
import { DocumentMapper } from '../../infrastructure/mappers/document.mapper';
import { DocumentResponseDto } from '../../presentation/dto/document-response.dto';

export interface UpdateDocumentInput {
  organizationId: string;
  documentId: string;
  deliverableId?: string | null;
  title?: string;
  description?: string | null;
  type?: string;
  status?: string;
}

@Injectable()
export class UpdateDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: DocumentRepository,
  ) {}

  async execute(
    input: UpdateDocumentInput,
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

      const deliverableId =
        input.deliverableId === undefined
          ? undefined
          : input.deliverableId
            ? new UniqueEntityId(input.deliverableId)
            : null;

      if (deliverableId) {
        const deliverableExists =
          await this.documentRepository.deliverableExists(
            deliverableId,
            document.projectId,
            organizationId,
          );

        if (!deliverableExists) {
          throw new Error('Deliverable not found.');
        }
      }

      document.update({
        title: input.title,
        description: input.description,
        deliverableId,
        type: input.type ? DocumentType.create(input.type) : undefined,
        status: input.status ? DocumentStatus.create(input.status) : undefined,
      });

      await this.documentRepository.save(document);

      return Result.ok(DocumentMapper.toResponse(document));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
