import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type {
  DocumentDetail,
  DocumentSummary,
  Paginated,
} from '../../../../shared/contracts/dashboard.contracts';
import { DeliverableOrmEntity } from '../../../deliverables/infrastructure/persistence/typeorm/deliverable.orm-entity';
import { ProjectOrmEntity } from '../../../projects/infrastructure/persistence/typeorm/project.orm-entity';
import { Document, DocumentVersionProps } from '../../domain/entities/document';
import {
  type DocumentRepository as DocumentRepositoryPort,
  type ListDocumentsParams,
} from '../../domain/repositories/document.repository';
import { DocumentMapper } from '../mappers/document.mapper';
import { DocumentOrmEntity } from '../persistence/typeorm/document.orm-entity';
import { DocumentVersionOrmEntity } from '../persistence/typeorm/document-version.orm-entity';

@Injectable()
export class TypeOrmDocumentRepository implements DocumentRepositoryPort {
  constructor(
    @InjectRepository(DocumentOrmEntity)
    private readonly documents: Repository<DocumentOrmEntity>,
    @InjectRepository(DocumentVersionOrmEntity)
    private readonly versions: Repository<DocumentVersionOrmEntity>,
    @InjectRepository(ProjectOrmEntity)
    private readonly projects: Repository<ProjectOrmEntity>,
    @InjectRepository(DeliverableOrmEntity)
    private readonly deliverables: Repository<DeliverableOrmEntity>,
  ) {}

  async save(document: Document): Promise<void> {
    await this.documents.save(DocumentMapper.toOrm(document));
  }

  async list(
    organizationId: OrganizationId,
    params: ListDocumentsParams,
  ): Promise<Paginated<DocumentSummary>> {
    const query = this.documents
      .createQueryBuilder('document')
      .where('document.organizationId = :organizationId', {
        organizationId: organizationId.toString(),
      })
      .orderBy('document.updatedAt', 'DESC')
      .addOrderBy('document.title', 'ASC')
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize);

      if (params.projectId) {
      console.log(params.projectId?.toString());
      query.andWhere('document.projectId = :projectId', {
        projectId: params.projectId.toString(),
      });
    }

    if (params.deliverableId) {
      query.andWhere('document.deliverableId = :deliverableId', {
        deliverableId: params.deliverableId.toString(),
      });
    }

    if (params.status) {
      query.andWhere('document.status = :status', { status: params.status });
    }

    if (params.type) {
      query.andWhere('document.type = :type', { type: params.type });
    }

    const [documents, total] = await query.getManyAndCount();
    const versionMap = await this.loadVersionsMap(
      organizationId,
      documents.map((document) => document.id),
    );

    return {
      items: documents.map((document) => {
        const domain = DocumentMapper.toDomain(
          document,
          versionMap.get(document.id) ?? [],
        );
        const response = DocumentMapper.toSummaryResponse(domain);

        return {
          ...response,
          updatedAt: document.updatedAt.toISOString(),
        };
      }),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  async getById(
    documentId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<DocumentDetail | null> {
    const document = await this.findById(documentId, organizationId);
    return document ? DocumentMapper.toResponse(document) : null;
  }

  async findById(
    documentId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<Document | null> {
    const document = await this.documents.findOne({
      where: {
        id: documentId.toString(),
        organizationId: organizationId.toString(),
      },
    });

    if (!document) {
      return null;
    }

    const versions = await this.versions.find({
      where: {
        documentId: document.id,
        organizationId: organizationId.toString(),
      },
      order: { uploadedAt: 'DESC' },
    });

    return DocumentMapper.toDomain(document, versions);
  }

  async delete(
    documentId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<void> {
    await this.documents.delete({
      id: documentId.toString(),
      organizationId: organizationId.toString(),
    });
  }

  async addVersion(
    document: Document,
    version: DocumentVersionProps,
  ): Promise<void> {
    await this.documents.manager.transaction(async (manager) => {
      await manager.save(DocumentOrmEntity, DocumentMapper.toOrm(document));

      if (version.isOfficial) {
        await manager.update(
          DocumentVersionOrmEntity,
          {
            documentId: document.id,
            organizationId: document.organizationId.toString(),
          },
          { isOfficial: false },
        );
      }

      await manager.save(
        DocumentVersionOrmEntity,
        DocumentMapper.versionToOrm(version),
      );
    });
  }

  projectExists(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<boolean> {
    return this.projects.exists({
      where: {
        id: projectId.toString(),
        organizationId: organizationId.toString(),
      },
    });
  }

  deliverableExists(
    deliverableId: UniqueEntityId,
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<boolean> {
    return this.deliverables.exists({
      where: {
        id: deliverableId.toString(),
        projectId: projectId.toString(),
        organizationId: organizationId.toString(),
      },
    });
  }

  private async loadVersionsMap(
    organizationId: OrganizationId,
    documentIds: string[],
  ): Promise<Map<string, DocumentVersionOrmEntity[]>> {
    const map = new Map<string, DocumentVersionOrmEntity[]>();

    if (documentIds.length === 0) {
      return map;
    }

    const versions = await this.versions
      .createQueryBuilder('version')
      .where('version.organizationId = :organizationId', {
        organizationId: organizationId.toString(),
      })
      .andWhere('version.documentId IN (:...documentIds)', { documentIds })
      .orderBy('version.uploadedAt', 'DESC')
      .getMany();

    for (const version of versions) {
      map.set(version.documentId, [
        ...(map.get(version.documentId) ?? []),
        version,
      ]);
    }

    return map;
  }
}
