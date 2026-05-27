import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../domain/repositories/document.repository';

export interface DeleteDocumentInput {
  organizationId: string;
  documentId: string;
}

@Injectable()
export class DeleteDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: DocumentRepository,
  ) {}

  async execute(input: DeleteDocumentInput): Promise<Result<void, Error>> {
    const organizationId = OrganizationId.create(input.organizationId);
    const documentId = new UniqueEntityId(input.documentId);
    const document = await this.documentRepository.findById(
      documentId,
      organizationId,
    );

    if (!document) {
      return Result.fail(new Error('Document not found.'));
    }

    await this.documentRepository.delete(documentId, organizationId);

    return Result.ok(undefined);
  }
}
