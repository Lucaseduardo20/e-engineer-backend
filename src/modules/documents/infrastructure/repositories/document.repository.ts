import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import type {
  DocumentDetail,
  DocumentSummary,
  Paginated,
} from '../../../../shared/contracts/dashboard.contracts';
import { DeliverableOrmEntity } from '../../../deliverables/infrastructure/persistence/typeorm/deliverable.orm-entity';
import { ProjectOrmEntity } from '../../../projects/infrastructure/persistence/typeorm/project.orm-entity';
import { TechnicalTagOrmEntity } from '../../../technical-taxonomy/infrastructure/persistence/typeorm/technical-tag.orm-entity';
import { Document, DocumentVersionProps } from '../../domain/entities/document';
import {
  type DocumentRepository as DocumentRepositoryPort,
  type ListDocumentsParams,
} from '../../domain/repositories/document.repository';
import { DocumentMapper } from '../mappers/document.mapper';
import { DocumentTagOrmEntity } from '../persistence/typeorm/document-tag.orm-entity';
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
    @InjectRepository(DocumentTagOrmEntity)
    private readonly documentTags: Repository<DocumentTagOrmEntity>,
    @InjectRepository(TechnicalTagOrmEntity)
    private readonly technicalTags: Repository<TechnicalTagOrmEntity>,
  ) {}

  async save(document: Document): Promise<void> {
    await this.documents.save(DocumentMapper.toOrm(document));
  }

  async syncTags(params: {
    documentId: UniqueEntityId;
    organizationId: OrganizationId;
    tagIds: string[];
    actorId: string;
    source?: string;
  }): Promise<void> {
    await this.documentTags.delete({
      documentId: params.documentId.toString(),
      organizationId: params.organizationId.toString(),
    });

    const unique = [...new Set(params.tagIds)].filter(Boolean);
    if (!unique.length) return;

    await this.documentTags.save(
      unique.map((tagId) => ({
        id: randomUUID(),
        organizationId: params.organizationId.toString(),
        documentId: params.documentId.toString(),
        tagId,
        source: params.source ?? 'manual',
        createdBy: params.actorId,
      })),
    );
  }

  async ensureSelectableTags(params: {
    organizationId: OrganizationId;
    tagIds: string[];
  }): Promise<void> {
    const unique = [...new Set(params.tagIds)].filter(Boolean);
    if (!unique.length) return;

    const tags = await this.technicalTags.find({
      where: {
        id: In(unique),
        organizationId: params.organizationId.toString(),
      },
      select: {
        id: true,
        status: true,
      },
    });

    const foundIds = new Set(tags.map((tag) => tag.id));
    const missing = unique.filter((tagId) => !foundIds.has(tagId));
    if (missing.length) {
      throw new Error('Technical tag not found for this organization.');
    }

    const archived = tags.find((tag) => tag.status === 'archived');
    if (archived) {
      throw new Error('Archived technical tags cannot be linked to a document.');
    }
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
    const tagsByDocument = await this.findTagsByDocumentIds(
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
          tagIds: (tagsByDocument.get(document.id) ?? []).map((tag) => tag.id),
          tags: tagsByDocument.get(document.id) ?? [],
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
    if (!document) return null;

    const tagsByDocument = await this.findTagsByDocumentIds(organizationId, [
      document.id,
    ]);
    const response = DocumentMapper.toResponse(document);

    return {
      ...response,
      tagIds: (tagsByDocument.get(document.id) ?? []).map((tag) => tag.id),
      tags: tagsByDocument.get(document.id) ?? [],
    };
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

  private async findTagsByDocumentIds(
    organizationId: OrganizationId,
    documentIds: string[],
  ): Promise<
    Map<
      string,
      Array<{
        id: string;
        name: string;
        slug: string;
        category: string;
        status: string;
      }>
    >
  > {
    if (!documentIds.length) return new Map();

    const rows = await this.documentTags
      .createQueryBuilder('documentTag')
      .innerJoin(
        TechnicalTagOrmEntity,
        'tag',
        'tag.id = documentTag.tag_id AND tag.organization_id = documentTag.organization_id',
      )
      .where('documentTag.organization_id = :organizationId', {
        organizationId: organizationId.toString(),
      })
      .andWhere('documentTag.document_id IN (:...documentIds)', { documentIds })
      .select([
        'documentTag.document_id AS "documentId"',
        'tag.id AS "id"',
        'tag.name AS "name"',
        'tag.slug AS "slug"',
        'tag.category AS "category"',
        'tag.status AS "status"',
      ])
      .orderBy('tag.name', 'ASC')
      .getRawMany<{
        documentId: string;
        id: string;
        name: string;
        slug: string;
        category: string;
        status: string;
      }>();

    return rows.reduce((map, row) => {
      const current = map.get(row.documentId) ?? [];
      current.push({
        id: row.id,
        name: row.name,
        slug: row.slug,
        category: row.category,
        status: row.status,
      });
      map.set(row.documentId, current);
      return map;
    }, new Map<string, Array<{ id: string; name: string; slug: string; category: string; status: string }>>());
  }
}
