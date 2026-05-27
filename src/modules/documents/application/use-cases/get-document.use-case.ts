import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type { DocumentDetail } from '../../../../shared/contracts/dashboard.contracts';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../domain/repositories/document.repository';

export interface GetDocumentInput {
  organizationId: string;
  documentId: string;
}

@Injectable()
export class GetDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: DocumentRepository,
  ) {}

  execute(input: GetDocumentInput): Promise<DocumentDetail | null> {
    return this.documentRepository.getById(
      new UniqueEntityId(input.documentId),
      OrganizationId.create(input.organizationId),
    );
  }
}
