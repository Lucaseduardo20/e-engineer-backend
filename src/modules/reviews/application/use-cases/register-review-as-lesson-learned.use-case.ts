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
  REVIEW_REPOSITORY,
  type ReviewRepository,
} from '../../domain/repositories/review.repository';
import { AuditQueryService } from '../../../audit/infrastructure/repositories/audit-query.service';

@Injectable()
export class RegisterReviewAsLessonLearnedUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(KNOWLEDGE_ITEM_REPOSITORY)
    private readonly knowledgeItems: KnowledgeItemRepository,
    private readonly audit: AuditQueryService,
  ) {}

  async execute(input: {
    organizationId: string;
    reviewId: string;
    createdBy: string;
    title: string;
    context: string;
    identifiedProblem: string;
    impact?: string;
    recommendation: string;
    tags?: string[];
    riskObservation?: string;
  }): Promise<Result<KnowledgeItemResponse, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const reviewId = new UniqueEntityId(input.reviewId);
      const review = await this.reviews.findById(reviewId, organizationId);
      if (!review) throw new Error('Review not found.');
      if (review.status.value !== 'rejected') {
        throw new Error('Only rejected reviews can register lesson learned.');
      }
      if (!input.title?.trim()) throw new Error('Title is required.');
      if (!input.context?.trim()) throw new Error('Context is required.');
      if (!input.identifiedProblem?.trim()) throw new Error('Identified problem is required.');
      if (!input.recommendation?.trim()) throw new Error('Recommendation is required.');

      const item = KnowledgeItem.create({
        organizationId,
        createdBy: input.createdBy,
        title: input.title,
        type: KnowledgeItemType.create('lesson_learned'),
        tags: input.tags,
        content: {
          summary: 'Licao aprendida registrada a partir de revisao reprovada.',
          sections: [
            { title: 'Contexto', body: input.context.trim() },
            { title: 'Problema identificado', body: input.identifiedProblem.trim() },
            { title: 'Impacto', body: input.impact?.trim() || 'Nao informado.' },
            { title: 'Recomendacao', body: input.recommendation.trim() },
            { title: 'Quando observar novamente', body: input.riskObservation?.trim() || 'Nao informado.' },
          ],
          checklist: [],
          metadata: {
            source: 'review',
            sourceReviewId: review.id,
            sourceReviewStatus: review.status.value,
            sourceProjectId: review.projectId.toString(),
            sourceDeliverableId: review.deliverableId?.toString() ?? null,
            sourceDocumentId: review.documentId?.toString() ?? null,
            sourceDocumentVersionId: review.documentVersionId?.toString() ?? null,
          },
        },
      });

      const relation = KnowledgeRelation.create({
        organizationId,
        knowledgeItemId: new UniqueEntityId(item.id),
        targetType: 'review',
        targetId: reviewId,
        relationType: 'lesson_from',
        createdBy: input.createdBy,
      });

      await this.knowledgeItems.save(item);
      await this.knowledgeItems.saveRelation(relation);
      await this.audit.record({
        organizationId: input.organizationId,
        actorName: input.createdBy,
        action: 'knowledge_item.created_from_review',
        entityType: 'knowledge_item',
        entityId: item.id,
        description: `Revisao registrada como licao aprendida: ${item.title}`,
        metadata: { sourceReviewId: review.id, sourceReviewStatus: review.status.value },
      });
      return Result.ok(KnowledgeItemMapper.toResponse(item));
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
