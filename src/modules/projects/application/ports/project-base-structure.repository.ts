import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';

export const PROJECT_BASE_STRUCTURE_REPOSITORY = Symbol(
  'PROJECT_BASE_STRUCTURE_REPOSITORY',
);

export interface ProjectBaseRecommendation {
  project: {
    id: string;
    name: string;
    client?: string | null;
    projectType?: string | null;
    status: string;
    progress: number;
  };
  matchedTags: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    status: string;
  }>;
  deliverablesPreview: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    tags: Array<{
      id: string;
      name: string;
      slug: string;
      category: string;
      status: string;
    }>;
  }>;
  documentsPreview: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    versionsCount: number;
  }>;
  reviewsCount: number;
  score: number;
}

export interface ProjectBaseStructureRepository {
  recommendByTags(params: {
    organizationId: OrganizationId;
    tagIds: string[];
    limit: number;
  }): Promise<ProjectBaseRecommendation[]>;
  cloneStructure(params: {
    organizationId: OrganizationId;
    baseProjectId: UniqueEntityId;
    targetProjectId: UniqueEntityId;
    actorId: string;
  }): Promise<{
    deliverablesCopied: number;
    documentsCopied: number;
    documentVersionsCopied: number;
    reviewsCopied: number;
  }>;
}
