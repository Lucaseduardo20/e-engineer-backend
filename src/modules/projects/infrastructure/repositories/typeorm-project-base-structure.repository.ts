import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { DeliverableTagOrmEntity } from '../../../deliverables/infrastructure/persistence/typeorm/deliverable-tag.orm-entity';
import { DeliverableOrmEntity } from '../../../deliverables/infrastructure/persistence/typeorm/deliverable.orm-entity';
import { DocumentVersionOrmEntity } from '../../../documents/infrastructure/persistence/typeorm/document-version.orm-entity';
import { DocumentOrmEntity } from '../../../documents/infrastructure/persistence/typeorm/document.orm-entity';
import { KnowledgeItemTagOrmEntity } from '../../../knowledge-base/infrastructure/persistence/typeorm/knowledge-item-tag.orm-entity';
import { KnowledgeRelationOrmEntity } from '../../../knowledge-base/infrastructure/persistence/typeorm/knowledge-relation.orm-entity';
import { ReviewOrmEntity } from '../../../reviews/infrastructure/persistence/typeorm/review.orm-entity';
import { TechnicalTagOrmEntity } from '../../../technical-taxonomy/infrastructure/persistence/typeorm/technical-tag.orm-entity';
import type {
  ProjectBaseRecommendation,
  ProjectBaseStructureRepository,
  SimilarProjectRecommendation,
} from '../../application/ports/project-base-structure.repository';
import { ProjectTagOrmEntity } from '../persistence/typeorm/project-tag.orm-entity';
import { ProjectBaseRelationOrmEntity } from '../persistence/typeorm/project-base-relation.orm-entity';
import { ProjectOrmEntity } from '../persistence/typeorm/project.orm-entity';

const similarProjectStatuses = [
  'active',
  'in_progress',
  'in_review',
  'overdue',
  'completed',
  'planning',
  'waiting_approval',
];

@Injectable()
export class TypeOrmProjectBaseStructureRepository
  implements ProjectBaseStructureRepository
{
  constructor(
    @InjectRepository(ProjectOrmEntity)
    private readonly projects: Repository<ProjectOrmEntity>,
    @InjectRepository(DeliverableOrmEntity)
    private readonly deliverables: Repository<DeliverableOrmEntity>,
    @InjectRepository(DeliverableTagOrmEntity)
    private readonly deliverableTags: Repository<DeliverableTagOrmEntity>,
    @InjectRepository(TechnicalTagOrmEntity)
    private readonly technicalTags: Repository<TechnicalTagOrmEntity>,
    @InjectRepository(ProjectTagOrmEntity)
    private readonly projectTags: Repository<ProjectTagOrmEntity>,
    @InjectRepository(ProjectBaseRelationOrmEntity)
    private readonly projectBaseRelations: Repository<ProjectBaseRelationOrmEntity>,
    @InjectRepository(DocumentOrmEntity)
    private readonly documents: Repository<DocumentOrmEntity>,
    @InjectRepository(DocumentVersionOrmEntity)
    private readonly documentVersions: Repository<DocumentVersionOrmEntity>,
    @InjectRepository(ReviewOrmEntity)
    private readonly reviews: Repository<ReviewOrmEntity>,
  ) {}

  async recommendByTags(params: {
    organizationId: OrganizationId;
    tagIds: string[];
    limit: number;
  }): Promise<ProjectBaseRecommendation[]> {
    const organizationId = params.organizationId.toString();
    const tagIds = [...new Set(params.tagIds)].filter(Boolean);

    if (!tagIds.length) {
      return [];
    }

    const deliverableRows = await this.projects
      .createQueryBuilder('project')
      .innerJoin(
        DeliverableOrmEntity,
        'deliverable',
        'deliverable.project_id = project.id AND deliverable.organization_id = project.organization_id',
      )
      .innerJoin(
        DeliverableTagOrmEntity,
        'deliverableTag',
        'deliverableTag.deliverable_id = deliverable.id AND deliverableTag.organization_id = project.organization_id',
      )
      .select('project.id', 'projectId')
      .addSelect('COUNT(DISTINCT deliverableTag.tag_id)', 'matchedCount')
      .where('project.organizationId = :organizationId', { organizationId })
      .andWhere('project.status IN (:...statuses)', {
        statuses: ['active', 'completed'],
      })
      .andWhere('deliverableTag.tag_id IN (:...tagIds)', { tagIds })
      .groupBy('project.id')
      .orderBy('"matchedCount"', 'DESC')
      .addOrderBy('project.updatedAt', 'DESC')
      .limit(params.limit)
      .getRawMany<{ projectId: string; matchedCount: string }>();
    const knowledgeRows = await this.projects
      .createQueryBuilder('project')
      .leftJoin(
        DeliverableOrmEntity,
        'deliverable',
        'deliverable.project_id = project.id AND deliverable.organization_id = project.organization_id',
      )
      .innerJoin(
        KnowledgeRelationOrmEntity,
        'knowledgeRelation',
        `knowledgeRelation.organization_id = project.organization_id
          AND (
            (knowledgeRelation.target_type = 'project' AND knowledgeRelation.target_id = project.id)
            OR (knowledgeRelation.target_type = 'deliverable' AND knowledgeRelation.target_id = deliverable.id)
          )`,
      )
      .innerJoin(
        KnowledgeItemTagOrmEntity,
        'knowledgeTag',
        'knowledgeTag.knowledge_item_id = knowledgeRelation.knowledge_item_id AND knowledgeTag.organization_id = project.organization_id',
      )
      .select('project.id', 'projectId')
      .addSelect('knowledgeTag.tag_id', 'tagId')
      .where('project.organizationId = :organizationId', { organizationId })
      .andWhere('project.status IN (:...statuses)', {
        statuses: ['active', 'completed'],
      })
      .andWhere('knowledgeTag.tag_id IN (:...tagIds)', { tagIds })
      .getRawMany<{ projectId: string; tagId: string }>();
    const matchedTagIdsByProject = new Map<string, Set<string>>();

    for (const row of knowledgeRows) {
      const current = matchedTagIdsByProject.get(row.projectId) ?? new Set<string>();
      current.add(row.tagId);
      matchedTagIdsByProject.set(row.projectId, current);
    }
    const projectScores = new Map<string, number>();

    for (const row of deliverableRows) {
      projectScores.set(row.projectId, Number(row.matchedCount) * 10);
    }

    for (const [projectId, tags] of matchedTagIdsByProject) {
      projectScores.set(
        projectId,
        Math.max(projectScores.get(projectId) ?? 0, tags.size * 10),
      );
    }

    const projectIds = [...projectScores.keys()]
      .sort(
        (first, second) =>
          (projectScores.get(second) ?? 0) - (projectScores.get(first) ?? 0),
      )
      .slice(0, params.limit);
    if (!projectIds.length) {
      return [];
    }

    const [projects, deliverables, documents, reviews] = await Promise.all([
      this.projects.find({
        where: { id: In(projectIds), organizationId },
      }),
      this.deliverables.find({
        where: { projectId: In(projectIds), organizationId },
        order: { dueDate: 'ASC', name: 'ASC' },
      }),
      this.documents.find({
        where: { projectId: In(projectIds), organizationId },
        order: { updatedAt: 'DESC', title: 'ASC' },
      }),
      this.reviews.find({
        where: { projectId: In(projectIds), organizationId },
      }),
    ]);
    const projectMap = new Map(projects.map((project) => [project.id, project]));
    const deliverableIds = deliverables.map((deliverable) => deliverable.id);
    const documentIds = documents.map((document) => document.id);
    const [tagRows, versionCounts] = await Promise.all([
      this.loadTagsByDeliverableIds(organizationId, deliverableIds),
      this.loadVersionCountsByDocumentIds(organizationId, documentIds),
    ]);
    const selectedTagsById = await this.loadTagsByIds(organizationId, tagIds);
    const deliverablesByProject = this.groupBy(
      deliverables,
      (item) => item.projectId,
    );
    const documentsByProject = this.groupBy(
      documents,
      (item) => item.projectId,
    );
    const reviewsByProject = this.groupBy(reviews, (item) => item.projectId);

    const recommendations: ProjectBaseRecommendation[] = [];

    for (const projectId of projectIds) {
      const project = projectMap.get(projectId);
      if (!project) continue;

      const projectDeliverables = deliverablesByProject.get(project.id) ?? [];
      const projectDocuments = documentsByProject.get(project.id) ?? [];
      const matchedTags = this.uniqueTags(
        [
          ...projectDeliverables.flatMap((deliverable) =>
            (tagRows.get(deliverable.id) ?? []).filter((tag) =>
              tagIds.includes(tag.id),
            ),
          ),
          ...[...(matchedTagIdsByProject.get(project.id) ?? [])]
            .map((tagId) => selectedTagsById.get(tagId))
            .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag)),
        ],
      );

      recommendations.push({
        project: {
          id: project.id,
          name: project.name,
          client: project.client,
          projectType: project.projectType,
          status: String(project.status),
          progress: 0,
        },
        matchedTags,
        deliverablesPreview: projectDeliverables
          .slice(0, 6)
          .map((deliverable) => ({
            id: deliverable.id,
            title: deliverable.name,
            type: deliverable.type,
            status: String(deliverable.status),
            tags: tagRows.get(deliverable.id) ?? [],
          })),
        documentsPreview: projectDocuments.slice(0, 5).map((document) => ({
            id: document.id,
            title: document.title,
            type: document.type,
            status: document.status,
            versionsCount: versionCounts.get(document.id) ?? 0,
          })),
        reviewsCount: reviewsByProject.get(project.id)?.length ?? 0,
        score: (projectScores.get(project.id) ?? 0) + projectDeliverables.length,
      });
    }

    return recommendations;
  }

  async recommendSimilarProjects(params: {
    organizationId: OrganizationId;
    tagIds: string[];
    limit: number;
  }): Promise<SimilarProjectRecommendation[]> {
    const organizationId = params.organizationId.toString();
    const tagIds = [...new Set(params.tagIds)].filter(Boolean);

    if (!tagIds.length) {
      return [];
    }

    const rows = await this.projects
      .createQueryBuilder('project')
      .innerJoin(
        ProjectTagOrmEntity,
        'projectTag',
        'projectTag.project_id = project.id AND projectTag.organization_id = project.organization_id',
      )
      .innerJoin(
        TechnicalTagOrmEntity,
        'tag',
        'tag.id = projectTag.tag_id AND tag.organization_id = project.organization_id',
      )
      .select('project.id', 'projectId')
      .addSelect('COUNT(DISTINCT projectTag.tag_id)', 'matchedCount')
      .where('project.organizationId = :organizationId', { organizationId })
      .andWhere('project.status IN (:...statuses)', {
        statuses: similarProjectStatuses,
      })
      .andWhere('projectTag.tag_id IN (:...tagIds)', { tagIds })
      .andWhere('tag.status != :archived', { archived: 'archived' })
      .groupBy('project.id')
      .orderBy('"matchedCount"', 'DESC')
      .addOrderBy('project.updatedAt', 'DESC')
      .limit(params.limit)
      .getRawMany<{ projectId: string; matchedCount: string }>();

    const projectIds = rows.map((row) => row.projectId);
    if (!projectIds.length) {
      return [];
    }

    const [projects, deliverables, documents, reviews, matchedTagsByProject] =
      await Promise.all([
        this.projects.find({
          where: { id: In(projectIds), organizationId },
        }),
        this.deliverables.find({
          where: { projectId: In(projectIds), organizationId },
        }),
        this.documents.find({
          where: { projectId: In(projectIds), organizationId },
        }),
        this.reviews.find({
          where: { projectId: In(projectIds), organizationId },
        }),
        this.loadMatchedProjectTags(organizationId, projectIds, tagIds),
      ]);

    const projectsById = new Map(projects.map((project) => [project.id, project]));
    const deliverablesByProject = this.groupBy(deliverables, (item) => item.projectId);
    const documentsByProject = this.groupBy(documents, (item) => item.projectId);
    const reviewsByProject = this.groupBy(reviews, (item) => item.projectId);
    const matchedCountByProject = new Map(
      rows.map((row) => [row.projectId, Number(row.matchedCount)]),
    );

    const recommendations: SimilarProjectRecommendation[] = [];

    for (const projectId of projectIds) {
      const project = projectsById.get(projectId);
      if (!project) continue;

      const matchedTags = matchedTagsByProject.get(projectId) ?? [];
      const counters = {
        matchedTags: matchedTags.length,
        deliverables: deliverablesByProject.get(projectId)?.length ?? 0,
        documents: documentsByProject.get(projectId)?.length ?? 0,
        reviews: reviewsByProject.get(projectId)?.length ?? 0,
      };
      const tagNames = matchedTags.map((tag) => tag.name).slice(0, 3);
      const reason = tagNames.length
        ? `Combina com ${tagNames.join(', ')}.`
        : 'Possui contexto tecnico semelhante.';

      recommendations.push({
        project: {
          id: project.id,
          name: project.name,
          client: project.client,
          projectType: project.projectType,
          status: String(project.status),
          progress: 0,
        },
        matchedTags,
        reason,
        counters,
        score: (matchedCountByProject.get(projectId) ?? 0) * 10,
      });
    }

    return recommendations.sort(
      (first, second) =>
        second.score - first.score ||
        second.counters.deliverables - first.counters.deliverables ||
        first.project.name.localeCompare(second.project.name),
    );
  }

  async cloneStructure(params: {
    organizationId: OrganizationId;
    baseProjectId: UniqueEntityId;
    targetProjectId: UniqueEntityId;
    actorId: string;
  }): Promise<{
    deliverablesCopied: number;
    documentsCopied: number;
    documentVersionsCopied: number;
    reviewsCopied: number;
  }> {
    const organizationId = params.organizationId.toString();
    const baseProjectId = params.baseProjectId.toString();
    const targetProjectId = params.targetProjectId.toString();

    const baseProjectExists = await this.projects.exists({
      where: {
        id: baseProjectId,
        organizationId,
      },
    });

    if (!baseProjectExists) {
      throw new Error('Base project not found.');
    }

    return this.projects.manager.transaction(async (manager) => {
      const [sourceDeliverables, sourceDocuments, sourceReviews] =
        await Promise.all([
          manager.find(DeliverableOrmEntity, {
            where: { projectId: baseProjectId, organizationId },
            order: { dueDate: 'ASC', name: 'ASC' },
          }),
          manager.find(DocumentOrmEntity, {
            where: { projectId: baseProjectId, organizationId },
            order: { updatedAt: 'ASC', title: 'ASC' },
          }),
          manager.find(ReviewOrmEntity, {
            where: { projectId: baseProjectId, organizationId },
            order: { createdAt: 'ASC' },
          }),
        ]);
      const sourceDeliverableIds = sourceDeliverables.map((item) => item.id);
      const sourceDocumentIds = sourceDocuments.map((item) => item.id);
      const [sourceTags, sourceVersions] = await Promise.all([
        sourceDeliverableIds.length
          ? manager.find(DeliverableTagOrmEntity, {
              where: {
                organizationId,
                deliverableId: In(sourceDeliverableIds),
              },
            })
          : Promise.resolve([]),
        sourceDocumentIds.length
          ? manager.find(DocumentVersionOrmEntity, {
              where: {
                organizationId,
                documentId: In(sourceDocumentIds),
              },
              order: { uploadedAt: 'ASC' },
            })
          : Promise.resolve([]),
      ]);
      const deliverableIdMap = new Map<string, string>();
      const documentIdMap = new Map<string, string>();
      const versionIdMap = new Map<string, string>();
      const now = new Date();

      const copiedDeliverables = sourceDeliverables.map((deliverable) => {
        const id = randomUUID();
        deliverableIdMap.set(deliverable.id, id);
        return manager.create(DeliverableOrmEntity, {
          ...deliverable,
          id,
          projectId: targetProjectId,
          templateDeliverableId: deliverable.templateDeliverableId,
          responsibleName: null,
          assignees: [],
          createdAt: now,
          updatedAt: now,
        });
      });
      await manager.save(DeliverableOrmEntity, copiedDeliverables);

      const copiedTags = sourceTags
        .map((tag) => {
          const deliverableId = deliverableIdMap.get(tag.deliverableId);
          if (!deliverableId) return null;
          return manager.create(DeliverableTagOrmEntity, {
            id: randomUUID(),
            organizationId,
            deliverableId,
            tagId: tag.tagId,
            createdBy: params.actorId,
            createdAt: now,
          });
        })
        .filter((tag): tag is DeliverableTagOrmEntity => Boolean(tag));
      await manager.save(DeliverableTagOrmEntity, copiedTags);

      const copiedDocuments = sourceDocuments.map((document) => {
        const id = randomUUID();
        documentIdMap.set(document.id, id);
        return manager.create(DocumentOrmEntity, {
          ...document,
          id,
          projectId: targetProjectId,
          deliverableId: document.deliverableId
            ? deliverableIdMap.get(document.deliverableId) ?? null
            : null,
          createdAt: now,
          updatedAt: now,
        });
      });
      await manager.save(DocumentOrmEntity, copiedDocuments);

      const copiedVersions = sourceVersions
        .map((version) => {
          const documentId = documentIdMap.get(version.documentId);
          if (!documentId) return null;
          const id = randomUUID();
          versionIdMap.set(version.id, id);
          return manager.create(DocumentVersionOrmEntity, {
            ...version,
            id,
            documentId,
            createdAt: now,
            updatedAt: now,
          });
        })
        .filter((version): version is DocumentVersionOrmEntity =>
          Boolean(version),
        );
      await manager.save(DocumentVersionOrmEntity, copiedVersions);

      const copiedReviews = sourceReviews.map((review) =>
        manager.create(ReviewOrmEntity, {
          ...review,
          id: randomUUID(),
          projectId: targetProjectId,
          deliverableId: review.deliverableId
            ? deliverableIdMap.get(review.deliverableId) ?? null
            : null,
          documentId: review.documentId
            ? documentIdMap.get(review.documentId) ?? null
            : null,
          documentVersionId: review.documentVersionId
            ? versionIdMap.get(review.documentVersionId) ?? null
            : null,
          status: 'pending',
          requestedBy: params.actorId,
          reviewers: [],
          reviewedBy: null,
          reviewedAt: null,
          decisionComment: null,
          createdAt: now,
          updatedAt: now,
        }),
      );
      await manager.save(ReviewOrmEntity, copiedReviews);

      return {
        deliverablesCopied: copiedDeliverables.length,
        documentsCopied: copiedDocuments.length,
        documentVersionsCopied: copiedVersions.length,
        reviewsCopied: copiedReviews.length,
      };
    });
  }

  baseProjectExists(params: {
    organizationId: OrganizationId;
    baseProjectId: UniqueEntityId;
  }): Promise<boolean> {
    return this.projects.exists({
      where: {
        id: params.baseProjectId.toString(),
        organizationId: params.organizationId.toString(),
      },
    });
  }

  async listBaseProjectTagIds(params: {
    organizationId: OrganizationId;
    baseProjectId: UniqueEntityId;
  }): Promise<string[]> {
    const rows = await this.projectTags.find({
      where: {
        organizationId: params.organizationId.toString(),
        projectId: params.baseProjectId.toString(),
      },
      select: {
        tagId: true,
      },
    });

    return [...new Set(rows.map((row) => row.tagId))];
  }

  async saveBaseRelation(params: {
    organizationId: OrganizationId;
    baseProjectId: UniqueEntityId;
    targetProjectId: UniqueEntityId;
    inheritTags: boolean;
    inheritDeliverables: boolean;
    actorId: string;
  }): Promise<void> {
    await this.projectBaseRelations.save({
      id: randomUUID(),
      organizationId: params.organizationId.toString(),
      baseProjectId: params.baseProjectId.toString(),
      targetProjectId: params.targetProjectId.toString(),
      relationType: 'created_from_base',
      inheritTags: params.inheritTags,
      inheritDeliverables: params.inheritDeliverables,
      createdBy: params.actorId,
    });
  }

  async copyDeliverablesOnly(params: {
    organizationId: OrganizationId;
    baseProjectId: UniqueEntityId;
    targetProjectId: UniqueEntityId;
    actorId: string;
  }): Promise<{ deliverablesCopied: number }> {
    const organizationId = params.organizationId.toString();
    const baseProjectId = params.baseProjectId.toString();
    const targetProjectId = params.targetProjectId.toString();

    return this.projects.manager.transaction(async (manager) => {
      const sourceDeliverables = await manager.find(DeliverableOrmEntity, {
        where: { projectId: baseProjectId, organizationId },
        order: { name: 'ASC' },
      });
      const sourceDeliverableIds = sourceDeliverables.map((item) => item.id);
      const sourceTags = sourceDeliverableIds.length
        ? await manager.find(DeliverableTagOrmEntity, {
            where: {
              organizationId,
              deliverableId: In(sourceDeliverableIds),
            },
          })
        : [];
      const deliverableIdMap = new Map<string, string>();
      const now = new Date();
      const copiedDeliverables = sourceDeliverables.map((deliverable) => {
        const id = randomUUID();
        deliverableIdMap.set(deliverable.id, id);
        return manager.create(DeliverableOrmEntity, {
          id,
          organizationId,
          projectId: targetProjectId,
          templateDeliverableId: deliverable.templateDeliverableId,
          name: deliverable.name,
          description: deliverable.description,
          status: 'todo',
          type: deliverable.type,
          responsibleName: null,
          assignees: [],
          dueDate: null,
          createdAt: now,
          updatedAt: now,
        });
      });

      await manager.save(DeliverableOrmEntity, copiedDeliverables);

      const copiedTags = sourceTags
        .map((tag) => {
          const deliverableId = deliverableIdMap.get(tag.deliverableId);
          if (!deliverableId) return null;
          return manager.create(DeliverableTagOrmEntity, {
            id: randomUUID(),
            organizationId,
            deliverableId,
            tagId: tag.tagId,
            createdBy: params.actorId,
            createdAt: now,
          });
        })
        .filter((tag): tag is DeliverableTagOrmEntity => Boolean(tag));

      await manager.save(DeliverableTagOrmEntity, copiedTags);

      return { deliverablesCopied: copiedDeliverables.length };
    });
  }

  private async loadTagsByDeliverableIds(
    organizationId: string,
    deliverableIds: string[],
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
    if (!deliverableIds.length) return new Map();

    const rows = await this.deliverableTags
      .createQueryBuilder('deliverableTag')
      .innerJoin(
        TechnicalTagOrmEntity,
        'tag',
        'tag.id = deliverableTag.tag_id AND tag.organization_id = deliverableTag.organization_id',
      )
      .select([
        'deliverableTag.deliverable_id AS "deliverableId"',
        'tag.id AS "id"',
        'tag.name AS "name"',
        'tag.slug AS "slug"',
        'tag.category AS "category"',
        'tag.status AS "status"',
      ])
      .where('deliverableTag.organization_id = :organizationId', {
        organizationId,
      })
      .andWhere('deliverableTag.deliverable_id IN (:...deliverableIds)', {
        deliverableIds,
      })
      .getRawMany<{
        deliverableId: string;
        id: string;
        name: string;
        slug: string;
        category: string;
        status: string;
      }>();

    const map = new Map<
      string,
      Array<{
        id: string;
        name: string;
        slug: string;
        category: string;
        status: string;
      }>
    >();

    for (const row of rows) {
      map.set(row.deliverableId, [...(map.get(row.deliverableId) ?? []), row]);
    }

    return map;
  }

  private async loadVersionCountsByDocumentIds(
    organizationId: string,
    documentIds: string[],
  ): Promise<Map<string, number>> {
    if (!documentIds.length) return new Map();

    const rows = await this.documentVersions
      .createQueryBuilder('version')
      .select('version.documentId', 'documentId')
      .addSelect('COUNT(version.id)', 'versionsCount')
      .where('version.organizationId = :organizationId', { organizationId })
      .andWhere('version.documentId IN (:...documentIds)', { documentIds })
      .groupBy('version.documentId')
      .getRawMany<{ documentId: string; versionsCount: string }>();

    return new Map(
      rows.map((row) => [row.documentId, Number(row.versionsCount)]),
    );
  }

  private async loadTagsByIds(
    organizationId: string,
    tagIds: string[],
  ): Promise<
    Map<
      string,
      {
        id: string;
        name: string;
        slug: string;
        category: string;
        status: string;
      }
    >
  > {
    if (!tagIds.length) return new Map();

    const tags = await this.technicalTags.find({
      where: {
        id: In(tagIds),
        organizationId,
      },
    });

    return new Map(
      tags.map((tag) => [
        tag.id,
        {
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          category: tag.category,
          status: tag.status,
        },
      ]),
    );
  }

  private async loadMatchedProjectTags(
    organizationId: string,
    projectIds: string[],
    tagIds: string[],
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
    if (!projectIds.length || !tagIds.length) return new Map();

    const rows = await this.projectTags
      .createQueryBuilder('projectTag')
      .innerJoin(
        TechnicalTagOrmEntity,
        'tag',
        'tag.id = projectTag.tag_id AND tag.organization_id = projectTag.organization_id',
      )
      .select([
        'projectTag.project_id AS "projectId"',
        'tag.id AS "id"',
        'tag.name AS "name"',
        'tag.slug AS "slug"',
        'tag.category AS "category"',
        'tag.status AS "status"',
      ])
      .where('projectTag.organization_id = :organizationId', {
        organizationId,
      })
      .andWhere('projectTag.project_id IN (:...projectIds)', { projectIds })
      .andWhere('projectTag.tag_id IN (:...tagIds)', { tagIds })
      .andWhere('tag.status != :archived', { archived: 'archived' })
      .orderBy('tag.name', 'ASC')
      .getRawMany<{
        projectId: string;
        id: string;
        name: string;
        slug: string;
        category: string;
        status: string;
      }>();

    const map = new Map<
      string,
      Array<{
        id: string;
        name: string;
        slug: string;
        category: string;
        status: string;
      }>
    >();

    for (const row of rows) {
      const tag = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        category: row.category,
        status: row.status,
      };
      map.set(row.projectId, [...(map.get(row.projectId) ?? []), tag]);
    }

    return map;
  }

  private groupBy<T>(
    values: T[],
    keySelector: (value: T) => string,
  ): Map<string, T[]> {
    const map = new Map<string, T[]>();

    for (const value of values) {
      const groupKey = keySelector(value);
      map.set(groupKey, [...(map.get(groupKey) ?? []), value]);
    }

    return map;
  }

  private uniqueTags(
    tags: Array<{
      id: string;
      name: string;
      slug: string;
      category: string;
      status: string;
    }>,
  ) {
    return [...new Map(tags.map((tag) => [tag.id, tag])).values()];
  }
}
