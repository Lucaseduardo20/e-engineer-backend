import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { KnowledgeItem } from '../../../knowledge-base/domain/entities/knowledge-item';
import { KnowledgeRelation } from '../../../knowledge-base/domain/entities/knowledge-relation';
import {
  KNOWLEDGE_ITEM_REPOSITORY,
  type KnowledgeItemRepository,
  type KnowledgeItemResponse,
} from '../../../knowledge-base/domain/repositories/knowledge-item.repository';
import { KnowledgeItemType } from '../../../knowledge-base/domain/value-objects/knowledge-item-type.vo';
import { KnowledgeItemMapper } from '../../../knowledge-base/infrastructure/mappers/knowledge-item.mapper';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../domain/repositories/document.repository';
import { AuditQueryService } from '../../../audit/infrastructure/repositories/audit-query.service';

@Injectable()
export class SaveDocumentAsKnowledgeModelUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documents: DocumentRepository,
    @Inject(KNOWLEDGE_ITEM_REPOSITORY)
    private readonly knowledgeItems: KnowledgeItemRepository,
    private readonly audit: AuditQueryService,
  ) {}

  async execute(input: {
    organizationId: string;
    documentId: string;
    documentVersionId?: string;
    createdBy: string;
    title: string;
    description?: string | null;
    tags?: string[];
    whenToUse?: string;
    notes?: string;
    allowNonOfficial?: boolean;
  }): Promise<Result<{ item: KnowledgeItemResponse; warning?: string }, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const documentId = new UniqueEntityId(input.documentId);
      const document = await this.documents.findById(documentId, organizationId);

      if (!document) throw new Error('Document not found.');
      if (!input.title?.trim()) throw new Error('Title is required.');

      const sourceVersion = input.documentVersionId
        ? document.versions.find((version) => version.id.toString() === input.documentVersionId) ?? null
        : null;
      if (input.documentVersionId && !sourceVersion) {
        throw new Error('Document version not found.');
      }
      const isOfficial = sourceVersion ? sourceVersion.isOfficial : document.status.value === 'approved';
      if (!isOfficial && !input.allowNonOfficial) {
        throw new Error('Only official documents can be saved as model.');
      }

      const item = KnowledgeItem.create({
        organizationId,
        createdBy: input.createdBy,
        title: input.title,
        description: input.description,
        type: KnowledgeItemType.create('document_model'),
        tags: input.tags,
        content: {
          summary: `Modelo criado a partir do documento ${document.title}.`,
          sections: [
            { title: 'Quando usar', body: input.whenToUse?.trim() || 'Nao informado.' },
            { title: 'Cuidados e observacoes', body: input.notes?.trim() || 'Nenhuma observacao informada.' },
          ],
          checklist: [],
          metadata: {
            source: 'document',
            sourceDocumentId: document.id,
            sourceDocumentVersionId: sourceVersion?.id.toString() ?? null,
            sourceDocumentTitle: document.title,
            sourceProjectId: document.projectId.toString(),
            sourceDeliverableId: document.deliverableId?.toString() ?? null,
            isSourceOfficial: isOfficial,
          },
        },
      });

      let relation = KnowledgeRelation.create({
        organizationId,
        knowledgeItemId: new UniqueEntityId(item.id),
        targetType: 'document',
        targetId: sourceVersion ? sourceVersion.id : documentId,
        relationType: 'based_on',
        createdBy: input.createdBy,
      });
      if (sourceVersion) {
        relation = KnowledgeRelation.create({
          organizationId,
          knowledgeItemId: new UniqueEntityId(item.id),
          targetType: 'document_version',
          targetId: sourceVersion.id,
          relationType: 'based_on',
          createdBy: input.createdBy,
        });
      }

      await this.knowledgeItems.save(item);
      await this.knowledgeItems.saveRelation(relation);
      await this.audit.record({
        organizationId: input.organizationId,
        actorName: input.createdBy,
        action: 'knowledge_item.created_from_document',
        entityType: 'knowledge_item',
        entityId: item.id,
        description: `Documento salvo como modelo: ${document.title}`,
        metadata: {
          sourceDocumentId: document.id,
          sourceDocumentVersionId: sourceVersion?.id.toString() ?? null,
        },
      });

      return Result.ok({
        item: KnowledgeItemMapper.toResponse(item),
        warning: isOfficial
          ? undefined
          : 'Este documento ainda nao esta marcado como oficial. Revise antes de reutilizar.',
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
