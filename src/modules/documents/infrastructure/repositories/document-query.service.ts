import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  DocumentSummary,
  Paginated,
} from '../../../../shared/contracts/dashboard.contracts';
import { DocumentOrmEntity } from '../persistence/typeorm/document.orm-entity';
import { DocumentVersionOrmEntity } from '../persistence/typeorm/document-version.orm-entity';

@Injectable()
export class DocumentQueryService {
  constructor(
    @InjectRepository(DocumentOrmEntity)
    private readonly documents: Repository<DocumentOrmEntity>,
    @InjectRepository(DocumentVersionOrmEntity)
    private readonly versions: Repository<DocumentVersionOrmEntity>,
  ) {}

  async list(input: {
    organizationId: string;
    page: number;
    pageSize: number;
  }): Promise<Paginated<DocumentSummary>> {
    const [documents, total] = await this.documents.findAndCount({
      where: { organizationId: input.organizationId },
      order: { updatedAt: 'DESC', title: 'ASC' },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    });
    const documentIds = documents.map((document) => document.id);
    const versions = documentIds.length
      ? await this.versions.find({
          where: documentIds.map((documentId) => ({
            organizationId: input.organizationId,
            documentId,
          })),
          order: { uploadedAt: 'DESC' },
        })
      : [];

    return {
      items: documents.map((document) => {
        const official = versions.find(
          (version) => version.documentId === document.id && version.isOfficial,
        );
        const latest = versions.find(
          (version) => version.documentId === document.id,
        );

        return {
          id: document.id,
          projectId: document.projectId,
          deliverableId: document.deliverableId,
          title: document.title,
          officialRevision: official?.revision ?? null,
          status: official?.status ?? latest?.status ?? 'draft',
          updatedAt: document.updatedAt.toISOString(),
        };
      }),
      total,
      page: input.page,
      pageSize: input.pageSize,
    };
  }
}
