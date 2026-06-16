import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TypeOrmTenantScopedRepository } from '../../../../../shared/infrastructure/persistence/typeorm/typeorm-tenant-scoped.repository';
import { OrganizationId } from '../../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../../shared/domain/value-objects/unique-entity-id';
import { Project } from '../../../domain/entities/project';
import {
  type ListProjectsParams,
  type ProjectTechnicalProfileTagSource,
  ProjectRepository,
} from '../../../domain/repositories/project.repository';
import { ProjectMapper } from '../../mappers/project.mapper';
import { ProjectOrmEntity } from './project.orm-entity';
import { ProjectTagOrmEntity } from './project-tag.orm-entity';
import { TechnicalTagOrmEntity } from '../../../../technical-taxonomy/infrastructure/persistence/typeorm/technical-tag.orm-entity';
import { DeliverableOrmEntity } from '../../../../deliverables/infrastructure/persistence/typeorm/deliverable.orm-entity';
import { DeliverableTagOrmEntity } from '../../../../deliverables/infrastructure/persistence/typeorm/deliverable-tag.orm-entity';
import type {
  Paginated,
  Project as ProjectContract,
} from '../../../../../shared/contracts/dashboard.contracts';
import {
  mapProjectStatus,
  progressFromStatus,
} from '../../../../../shared/presentation/status-mappers';

const projectStatusFilters: Record<ProjectContract['status'], string[]> = {
  draft: ['draft', 'planning'],
  active: ['active', 'in_progress', 'in_review', 'overdue'],
  paused: ['on_hold', 'waiting_approval'],
  completed: ['completed'],
  archived: ['cancelled'],
};

@Injectable()
export class TypeOrmProjectRepository
  extends TypeOrmTenantScopedRepository<ProjectOrmEntity>
  implements ProjectRepository
{
  constructor(
    @InjectRepository(ProjectOrmEntity)
    repository: Repository<ProjectOrmEntity>,
    @InjectRepository(ProjectTagOrmEntity)
    private readonly projectTags: Repository<ProjectTagOrmEntity>,
    @InjectRepository(TechnicalTagOrmEntity)
    private readonly technicalTags: Repository<TechnicalTagOrmEntity>,
    @InjectRepository(DeliverableTagOrmEntity)
    private readonly deliverableTags: Repository<DeliverableTagOrmEntity>,
  ) {
    super(repository);
  }

  async save(project: Project): Promise<void> {
    await this.saveOrm(ProjectMapper.toOrm(project));
  }

  async syncTags(params: {
    projectId: UniqueEntityId;
    organizationId: OrganizationId;
    tagIds: string[];
    actorId: string;
  }): Promise<void> {
    await this.projectTags.delete({
      projectId: params.projectId.toString(),
      organizationId: params.organizationId.toString(),
    });

    const unique = [...new Set(params.tagIds)].filter(Boolean);
    if (!unique.length) return;

    await this.projectTags.save(
      unique.map((tagId) => ({
        id: randomUUID(),
        organizationId: params.organizationId.toString(),
        projectId: params.projectId.toString(),
        tagId,
        source: 'manual',
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

    const blocked = tags.find((tag) => tag.status !== 'active');
    if (blocked) {
      throw new Error('Only active technical tags can be linked to a project.');
    }
  }

  async list(
    organizationId: OrganizationId,
    params: ListProjectsParams,
  ): Promise<Paginated<ProjectContract>> {
    const query = this.repository
      .createQueryBuilder('project')
      .where('project.organizationId = :organizationId', {
        organizationId: organizationId.toString(),
      })
      .orderBy('project.updatedAt', 'DESC')
      .addOrderBy('project.name', 'ASC')
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize);

    if (params.name) {
      query.andWhere('project.name ILIKE :name', {
        name: `%${params.name}%`,
      });
    }

    if (params.status) {
      query.andWhere('project.status IN (:...statuses)', {
        statuses: projectStatusFilters[params.status],
      });
    }

    const [items, total] = await query.getManyAndCount();
    const tagsByProject = await this.findTagsByProjectIds(
      organizationId,
      items.map((item) => item.id),
    );

    return {
      items: items.map((item) =>
        this.toContract(item, tagsByProject.get(item.id) ?? []),
      ),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  async getById(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<ProjectContract | null> {
    const project = await this.repository.findOne({
      where: {
        id: projectId.toString(),
        organizationId: organizationId.toString(),
      },
    });

    if (!project) return null;

    const tagsByProject = await this.findTagsByProjectIds(organizationId, [
      project.id,
    ]);

    return this.toContract(project, tagsByProject.get(project.id) ?? []);
  }

  async findById(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<Project | null> {
    const ormEntity = await this.findOneById(projectId.toString(), {
      organizationId,
    });

    return ormEntity ? ProjectMapper.toDomain(ormEntity) : null;
  }

  async listTechnicalProfileTagSources(
    projectId: UniqueEntityId,
    organizationId: OrganizationId,
  ): Promise<ProjectTechnicalProfileTagSource[]> {
    const projectTagSources = await this.projectTags
      .createQueryBuilder('pt')
      .innerJoin(
        'technical_tags',
        'tag',
        'tag.id = pt.tag_id AND tag.organization_id = pt.organization_id',
      )
      .where('pt.organization_id = :organizationId', {
        organizationId: organizationId.toString(),
      })
      .andWhere('pt.project_id = :projectId', {
        projectId: projectId.toString(),
      })
      .andWhere('tag.status != :archived', { archived: 'archived' })
      .select([
        'tag.id AS "tagId"',
        'tag.name AS "name"',
        'tag.slug AS "slug"',
        'tag.category AS "category"',
        'tag.status AS "status"',
        'pt.source AS "source"',
      ])
      .orderBy('tag.name', 'ASC')
      .getRawMany<ProjectTechnicalProfileTagSource>();
    const deliverableTagSources = await this.deliverableTags
      .createQueryBuilder('dt')
      .innerJoin(
        DeliverableOrmEntity,
        'deliverable',
        'deliverable.id = dt.deliverable_id AND deliverable.organization_id = dt.organization_id',
      )
      .innerJoin(
        'technical_tags',
        'tag',
        'tag.id = dt.tag_id AND tag.organization_id = dt.organization_id',
      )
      .where('dt.organization_id = :organizationId', {
        organizationId: organizationId.toString(),
      })
      .andWhere('deliverable.project_id = :projectId', {
        projectId: projectId.toString(),
      })
      .andWhere('tag.status != :archived', { archived: 'archived' })
      .select([
        'tag.id AS "tagId"',
        'tag.name AS "name"',
        'tag.slug AS "slug"',
        'tag.category AS "category"',
        'tag.status AS "status"',
        `'deliverable_tag' AS "source"`,
      ])
      .orderBy('tag.name', 'ASC')
      .getRawMany<ProjectTechnicalProfileTagSource>();

    return [...projectTagSources, ...deliverableTagSources];
  }

  private toContract(
    project: ProjectOrmEntity,
    tags: Array<{
      id: string;
      name: string;
      slug: string;
      category: string;
      status: string;
    }>,
  ): ProjectContract {
    return {
      id: project.id,
      name: project.name,
      description: project.client ?? undefined,
      client: project.client,
      projectType: project.projectType,
      responsibleName: project.responsibleName,
      status: mapProjectStatus(project.status),
      organizationId: project.organizationId,
      progress: progressFromStatus(project.status),
      tagIds: tags.map((tag) => tag.id),
      tags,
      legacyTags: project.tags,
      metrics: {
        tags: tags.length,
      },
    };
  }

  private async findTagsByProjectIds(
    organizationId: OrganizationId,
    projectIds: string[],
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
    if (!projectIds.length) return new Map();

    const rows = await this.projectTags
      .createQueryBuilder('pt')
      .innerJoin(
        'technical_tags',
        'tag',
        'tag.id = pt.tag_id AND tag.organization_id = pt.organization_id',
      )
      .where('pt.organization_id = :organizationId', {
        organizationId: organizationId.toString(),
      })
      .andWhere('pt.project_id IN (:...projectIds)', { projectIds })
      .select([
        'pt.project_id AS "projectId"',
        'tag.id AS "id"',
        'tag.name AS "name"',
        'tag.slug AS "slug"',
        'tag.category AS "category"',
        'tag.status AS "status"',
      ])
      .orderBy('tag.name', 'ASC')
      .getRawMany<{
        projectId: string;
        id: string;
        name: string;
        slug: string;
        category: string;
        status: string;
      }>();

    return rows.reduce(
      (map, row) => {
        const current = map.get(row.projectId) ?? [];
        current.push({
          id: row.id,
          name: row.name,
          slug: row.slug,
          category: row.category,
          status: row.status,
        });
        map.set(row.projectId, current);
        return map;
      },
      new Map<
        string,
        Array<{
          id: string;
          name: string;
          slug: string;
          category: string;
          status: string;
        }>
      >(),
    );
  }
}
