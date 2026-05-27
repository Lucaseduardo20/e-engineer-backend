import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Document } from '../../domain/entities/document';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../domain/repositories/document.repository';
import { DocumentStatus } from '../../domain/value-objects/document-status.value-object';
import { DocumentType } from '../../domain/value-objects/document-type.value-object';
import { DocumentMapper } from '../../infrastructure/mappers/document.mapper';
import { DocumentResponseDto } from '../../presentation/dto/document-response.dto';

export interface CreateDocumentInput {
  organizationId: string;
  projectId: string;
  deliverableId?: string | null;
  title: string;
  description?: string | null;
  type: string;
  status?: string;
}

@Injectable()
export class CreateDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: DocumentRepository,
  ) {}

  async execute(
    input: CreateDocumentInput,
  ): Promise<Result<DocumentResponseDto, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const projectId = new UniqueEntityId(input.projectId);
      const projectExists = await this.documentRepository.projectExists(
        projectId,
        organizationId,
      );

      if (!projectExists) {
        throw new Error('Project not found.');
      }

      const deliverableId = input.deliverableId
        ? new UniqueEntityId(input.deliverableId)
        : null;

      if (deliverableId) {
        const deliverableExists =
          await this.documentRepository.deliverableExists(
            deliverableId,
            projectId,
            organizationId,
          );

        if (!deliverableExists) {
          throw new Error('Deliverable not found.');
        }
      }

      const document = Document.create({
        organizationId,
        projectId,
        deliverableId,
        title: input.title,
        description: input.description,
        type: DocumentType.create(input.type),
        status: input.status
          ? DocumentStatus.create(input.status)
          : DocumentStatus.draft(),
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
