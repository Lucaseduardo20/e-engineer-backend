import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type {
  DocumentDetail,
  DocumentSummary,
  Paginated,
} from '../../../../shared/contracts/dashboard.contracts';
import { Document, DocumentVersionProps } from '../entities/document';

export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');

export interface ListDocumentsParams {
  page: number;
  pageSize: number;
  projectId?: UniqueEntityId;
  deliverableId?: UniqueEntityId;
  status?: string;
  type?: string;
}

export interface DocumentRepository {
  save(document: Document): Promise<void>;
  list(
    organizationId: OrganizationId,
    params: ListDocumentsParams,
  ): Promise<Paginated<DocumentSummary>>;
  getById(
    documentId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<DocumentDetail | null>;
  findById(
    documentId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<Document | null>;
  delete(
    documentId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<void>;
  addVersion(document: Document, version: DocumentVersionProps): Promise<void>;
  projectExists(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<boolean>;
  deliverableExists(
    deliverableId: UniqueEntityId,
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<boolean>;
}
