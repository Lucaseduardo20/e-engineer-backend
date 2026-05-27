import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type {
  DocumentSummary,
  Paginated,
} from '../../../../shared/contracts/dashboard.contracts';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../domain/repositories/document.repository';

export interface ListDocumentsInput {
  organizationId: string;
  page: number;
  pageSize: number;
  projectId?: string;
  deliverableId?: string;
  status?: string;
  type?: string;
}

@Injectable()
export class ListDocumentsUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: DocumentRepository,
  ) {}

  execute(input: ListDocumentsInput): Promise<Paginated<DocumentSummary>> {
    return this.documentRepository.list(
      OrganizationId.create(input.organizationId),
      {
        page: input.page,
        pageSize: input.pageSize,
        projectId: input.projectId
          ? new UniqueEntityId(input.projectId)
          : undefined,
        deliverableId: input.deliverableId
          ? new UniqueEntityId(input.deliverableId)
          : undefined,
        status: input.status,
        type: input.type,
      },
    );
  }
}
