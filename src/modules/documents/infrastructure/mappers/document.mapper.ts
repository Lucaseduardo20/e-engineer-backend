import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Document, DocumentVersionProps } from '../../domain/entities/document';
import { DocumentStatus } from '../../domain/value-objects/document-status.value-object';
import { DocumentType } from '../../domain/value-objects/document-type.value-object';
import {
  DocumentResponseDto,
  DocumentSummaryResponseDto,
  DocumentVersionResponseDto,
} from '../../presentation/dto/document-response.dto';
import { DocumentOrmEntity } from '../persistence/typeorm/document.orm-entity';
import { DocumentVersionOrmEntity } from '../persistence/typeorm/document-version.orm-entity';

export class DocumentMapper {
  static toDomain(
    ormEntity: DocumentOrmEntity,
    versions: DocumentVersionOrmEntity[] = [],
  ): Document {
    return Document.restore(
      {
        organizationId: OrganizationId.create(ormEntity.organizationId),
        projectId: new UniqueEntityId(ormEntity.projectId),
        deliverableId: ormEntity.deliverableId
          ? new UniqueEntityId(ormEntity.deliverableId)
          : null,
        title: ormEntity.title,
        description: ormEntity.description,
        type: ormEntity.type
          ? DocumentType.create(ormEntity.type)
          : DocumentType.fromTitle(ormEntity.title),
        status: DocumentStatus.fromPersistence(ormEntity.status),
        versions: versions.map((version) =>
          DocumentMapper.versionToDomain(version),
        ),
      },
      new UniqueEntityId(ormEntity.id),
    );
  }

  static toOrm(document: Document): DocumentOrmEntity {
    const ormEntity = new DocumentOrmEntity();

    ormEntity.id = document.id;
    ormEntity.organizationId = document.organizationId.toString();
    ormEntity.projectId = document.projectId.toString();
    ormEntity.deliverableId = document.deliverableId?.toString() ?? null;
    ormEntity.title = document.title;
    ormEntity.description = document.description;
    ormEntity.type = document.type.value;
    ormEntity.status = document.status.value;

    return ormEntity;
  }

  static versionToOrm(version: DocumentVersionProps): DocumentVersionOrmEntity {
    const ormEntity = new DocumentVersionOrmEntity();

    ormEntity.id = version.id.toString();
    ormEntity.organizationId = version.organizationId.toString();
    ormEntity.documentId = version.documentId.toString();
    ormEntity.revision = version.revision;
    ormEntity.fileName = version.fileName;
    ormEntity.filePath = version.filePath;
    ormEntity.uploadedBy = version.uploadedBy;
    ormEntity.uploadedAt = version.uploadedAt;
    ormEntity.isOfficial = version.isOfficial;
    ormEntity.status = version.status.value;
    ormEntity.notes = version.notes ?? null;

    return ormEntity;
  }

  static toSummaryResponse(document: Document): DocumentSummaryResponseDto {
    const latestVersion = document.latestVersion;
    const officialVersion = document.officialVersion;

    return {
      id: document.id,
      projectId: document.projectId.toString(),
      deliverableId: document.deliverableId?.toString() ?? null,
      title: document.title,
      description: document.description,
      type: document.type.value,
      officialRevision: officialVersion?.revision ?? null,
      status: officialVersion?.status.value ?? document.status.value,
      updatedAt: (latestVersion?.uploadedAt ?? new Date()).toISOString(),
      latestVersion: latestVersion
        ? DocumentMapper.versionToResponse(latestVersion)
        : null,
      officialVersion: officialVersion
        ? DocumentMapper.versionToResponse(officialVersion)
        : null,
    };
  }

  static toResponse(document: Document): DocumentResponseDto {
    return {
      ...DocumentMapper.toSummaryResponse(document),
      versions: document.versions.map((version) =>
        DocumentMapper.versionToResponse(version),
      ),
    };
  }

  static versionToResponse(
    version: DocumentVersionProps,
  ): DocumentVersionResponseDto {
    return {
      id: version.id.toString(),
      documentId: version.documentId.toString(),
      revision: version.revision,
      fileName: version.fileName,
      filePath: version.filePath,
      uploadedBy: version.uploadedBy,
      uploadedAt: version.uploadedAt.toISOString(),
      isOfficial: version.isOfficial,
      status: version.status.value,
      notes: version.notes ?? null,
    };
  }

  private static versionToDomain(
    ormEntity: DocumentVersionOrmEntity,
  ): DocumentVersionProps {
    return {
      id: new UniqueEntityId(ormEntity.id),
      organizationId: OrganizationId.create(ormEntity.organizationId),
      documentId: new UniqueEntityId(ormEntity.documentId),
      revision: ormEntity.revision,
      fileName: ormEntity.fileName,
      filePath: ormEntity.filePath,
      uploadedBy: ormEntity.uploadedBy,
      uploadedAt: ormEntity.uploadedAt,
      isOfficial: ormEntity.isOfficial,
      status: DocumentStatus.fromPersistence(ormEntity.status),
      notes: ormEntity.notes,
    };
  }
}
