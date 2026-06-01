import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import {
  KNOWLEDGE_ITEM_REPOSITORY,
  type KnowledgeItemRepository,
} from '../../../knowledge-base/domain/repositories/knowledge-item.repository';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from '../../domain/repositories/project.repository';
import { AuditQueryService } from '../../../audit/infrastructure/repositories/audit-query.service';

@Injectable()
export class UnlinkKnowledgeItemFromProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projects: ProjectRepository,
    @Inject(KNOWLEDGE_ITEM_REPOSITORY)
    private readonly knowledgeItems: KnowledgeItemRepository,
    private readonly audit: AuditQueryService,
  ) {}

  async execute(input: {
    organizationId: string;
    projectId: string;
    relationId: string;
  }): Promise<Result<{ removed: true }, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const projectId = new UniqueEntityId(input.projectId);
      const project = await this.projects.getById(projectId, organizationId);

      if (!project) {
        throw new Error('Project not found.');
      }

      const page = await this.knowledgeItems.list(organizationId, {
        page: 1,
        pageSize: 100,
        includeArchived: true,
      });

      let knowledgeItemId: string | null = null;

      for (const item of page.items) {
        const detail = await this.knowledgeItems.findByIdWithRelations(
          new UniqueEntityId(item.id),
          organizationId,
        );

        const relation = detail?.relations.find(
          (value) =>
            value.id === input.relationId &&
            value.targetType === 'project' &&
            value.targetId === input.projectId,
        );

        if (relation) {
          knowledgeItemId = item.id;
          break;
        }
      }

      if (!knowledgeItemId) {
        throw new Error('Knowledge relation not found for this project.');
      }

      await this.knowledgeItems.removeRelation({
        relationId: new UniqueEntityId(input.relationId),
        knowledgeItemId: new UniqueEntityId(knowledgeItemId),
        organizationId,
      });
      await this.audit.record({
        organizationId: input.organizationId,
        actorName: 'system',
        action: 'knowledge_item.unlinked_from_project',
        entityType: 'knowledge_item',
        entityId: knowledgeItemId,
        description: 'Conhecimento removido do projeto.',
        metadata: { projectId: input.projectId, relationId: input.relationId },
      });

      return Result.ok({ removed: true });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
