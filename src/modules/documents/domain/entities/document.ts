import { AggregateRoot } from '../../../../shared/domain/entities/aggregate-root';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { DocumentStatus } from '../value-objects/document-status.value-object';
import { DocumentType } from '../value-objects/document-type.value-object';

export interface DocumentVersionProps {
  id: UniqueEntityId;
  organizationId: OrganizationId;
  documentId: UniqueEntityId;
  revision: string;
  fileName: string;
  filePath: string;
  uploadedBy: string;
  uploadedAt: Date;
  isOfficial: boolean;
  status: DocumentStatus;
  notes?: string | null;
}

export interface DocumentProps {
  organizationId: OrganizationId;
  projectId: UniqueEntityId;
  deliverableId?: UniqueEntityId | null;
  title: string;
  description?: string | null;
  type: DocumentType;
  status: DocumentStatus;
  versions: DocumentVersionProps[];
}

export class Document extends AggregateRoot<DocumentProps> {
  private constructor(props: DocumentProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(params: {
    organizationId: OrganizationId;
    projectId: UniqueEntityId;
    deliverableId?: UniqueEntityId | null;
    title: string;
    description?: string | null;
    type?: DocumentType;
    status?: DocumentStatus;
  }): Document {
    return new Document({
      organizationId: params.organizationId,
      projectId: params.projectId,
      deliverableId: params.deliverableId ?? null,
      title: this.normalizeTitle(params.title),
      description: this.normalizeOptionalText(params.description),
      type: params.type ?? DocumentType.fromTitle(params.title),
      status: params.status ?? DocumentStatus.draft(),
      versions: [],
    });
  }

  static restore(props: DocumentProps, id: UniqueEntityId): Document {
    return new Document(
      {
        ...props,
        title: this.normalizeTitle(props.title),
        description: this.normalizeOptionalText(props.description),
        deliverableId: props.deliverableId ?? null,
        versions: props.versions.map((version) => ({
          ...version,
          revision: this.normalizeRevision(version.revision),
          fileName: this.normalizeFileName(version.fileName),
          notes: this.normalizeOptionalText(version.notes),
        })),
      },
      id,
    );
  }

  update(params: {
    title?: string;
    description?: string | null;
    type?: DocumentType;
    status?: DocumentStatus;
    deliverableId?: UniqueEntityId | null;
  }): void {
    if (params.title !== undefined) {
      this.props.title = Document.normalizeTitle(params.title);
    }

    if (params.description !== undefined) {
      this.props.description = Document.normalizeOptionalText(
        params.description,
      );
    }

    if (params.type) {
      this.props.type = params.type;
    }

    if (params.status) {
      this.props.status = params.status;
    }

    if (params.deliverableId !== undefined) {
      this.props.deliverableId = params.deliverableId;
    }
  }

  addVersion(params: {
    revision?: string;
    fileName: string;
    filePath: string;
    uploadedBy: string;
    uploadedAt?: Date;
    isOfficial?: boolean;
    status?: DocumentStatus;
    notes?: string | null;
  }): DocumentVersionProps {
    const versionStatus = params.status ?? this.status;
    const version: DocumentVersionProps = {
      id: new UniqueEntityId(),
      organizationId: this.organizationId,
      documentId: this.getId(),
      revision: Document.normalizeRevision(
        params.revision ?? this.nextRevisionLabel(),
      ),
      fileName: Document.normalizeFileName(params.fileName),
      filePath: this.normalizeFilePath(params.filePath),
      uploadedBy: Document.normalizeUploadedBy(params.uploadedBy),
      uploadedAt: params.uploadedAt ?? new Date(),
      isOfficial: params.isOfficial ?? false,
      status: versionStatus,
      notes: Document.normalizeOptionalText(params.notes),
    };

    if (version.isOfficial) {
      this.props.versions = this.props.versions.map((currentVersion) => ({
        ...currentVersion,
        isOfficial: false,
      }));
      this.props.status = versionStatus;
    }

    this.props.versions = [...this.props.versions, version];

    return version;
  }

  get id(): string {
    return this.getId().toString();
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }

  get projectId(): UniqueEntityId {
    return this.props.projectId;
  }

  get deliverableId(): UniqueEntityId | null {
    return this.props.deliverableId ?? null;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | null {
    return this.props.description ?? null;
  }

  get type(): DocumentType {
    return this.props.type;
  }

  get status(): DocumentStatus {
    return this.props.status;
  }

  get versions(): DocumentVersionProps[] {
    return [...this.props.versions].sort(
      (left, right) => right.uploadedAt.getTime() - left.uploadedAt.getTime(),
    );
  }

  get officialVersion(): DocumentVersionProps | null {
    return this.versions.find((version) => version.isOfficial) ?? null;
  }

  get latestVersion(): DocumentVersionProps | null {
    return this.versions[0] ?? null;
  }

  private nextRevisionLabel(): string {
    return `R${String(this.props.versions.length + 1).padStart(2, '0')}`;
  }

  private normalizeFilePath(value: string): string {
    const filePath = value.trim();

    if (!filePath) {
      throw new Error('Document version file path is required.');
    }

    return filePath;
  }

  private static normalizeTitle(value: string): string {
    const title = value.trim();

    if (!title) {
      throw new Error('Document title is required.');
    }

    if (title.length > 180) {
      throw new Error('Document title must have at most 180 characters.');
    }

    return title;
  }

  private static normalizeOptionalText(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const text = value.trim();
    return text.length ? text : null;
  }

  private static normalizeRevision(value: string): string {
    const revision = value.trim().toUpperCase();

    if (!revision) {
      throw new Error('Document revision is required.');
    }

    if (revision.length > 20) {
      throw new Error('Document revision must have at most 20 characters.');
    }

    return revision;
  }

  private static normalizeFileName(value: string): string {
    const fileName = value.trim();

    if (!fileName) {
      throw new Error('Document version file name is required.');
    }

    if (fileName.length > 220) {
      throw new Error(
        'Document version file name must have at most 220 characters.',
      );
    }

    return fileName;
  }

  private static normalizeUploadedBy(value: string): string {
    const uploadedBy = value.trim();

    if (!uploadedBy) {
      throw new Error('Document version uploader is required.');
    }

    return uploadedBy.slice(0, 120);
  }
}
