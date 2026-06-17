export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  roles: string[];
  isPlatformAdmin?: boolean;
  impersonatedBy?: string | null;
  organizationId?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  parentId?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  client?: string | null;
  projectType?: string | null;
  responsibleName?: string | null;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  organizationId: string;
  startDate?: string;
  endDate?: string;
  progress: number;
  tagIds?: string[];
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    status: string;
  }>;
  legacyTags?: string[];
  metrics?: Record<string, number>;
}

export interface ProjectTechnicalProfileSource {
  type: 'project_tag' | 'deliverable_tag' | 'document_tag' | 'official_document';
  score: number;
}

export interface ProjectTechnicalProfileTag {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  score: number;
  sources: ProjectTechnicalProfileSource[];
}

export interface ProjectTechnicalProfile {
  projectId: string;
  organizationId: string;
  scoreExplanation: string;
  tags: ProjectTechnicalProfileTag[];
}

export interface Deliverable {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  type:
    | 'technical_survey'
    | 'architectural_project'
    | 'structural_project'
    | 'electrical_project'
    | 'hydraulic_project'
    | 'drainage_project'
    | 'paving_project'
    | 'landscaping_project'
    | 'lighting_project'
    | 'descriptive_memorial'
    | 'budget'
    | 'schedule'
    | 'art_rrt'
    | 'photographic_report'
    | 'technical_report'
    | 'other';
  assignees: string[];
  tagIds?: string[];
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    status: string;
  }>;
  inheritanceReview?: {
    relationId: string;
    baseProjectId: string;
    baseDeliverableId: string;
    needsReviewAfterInheritance: boolean;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
  } | null;
  removalRequest?: {
    id: string;
    status: string;
    reason: string;
    requestedBy: string;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    reviewComment?: string | null;
  } | null;
  attachments?: { url: string; name: string }[];
}

export interface ProjectKnowledgeRecommendation {
  type: 'knowledge_item' | 'document_model' | 'review_checklist' | 'project_reference';
  knowledgeItem: {
    id: string;
    title: string;
    description?: string | null;
    type: string;
    status: string;
    tags: Array<{
      id: string;
      name: string;
      slug: string;
      category: string;
      status: string;
    }>;
    updatedAt: string;
    publishedAt?: string | null;
  };
  matchedTags: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    status: string;
  }>;
  score: number;
  reason: string;
  alreadyApplied: boolean;
}

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

export interface ProjectSimilarRecommendation {
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
  reason: string;
  counters: {
    matchedTags: number;
    deliverables: number;
    documents: number;
    reviews: number;
  };
  score: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DocumentSummary {
  id: string;
  projectId: string;
  deliverableId?: string | null;
  title: string;
  description?: string | null;
  type: string;
  officialRevision?: string | null;
  status: string;
  updatedAt: string;
  tagIds?: string[];
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    status: string;
  }>;
  latestVersion?: DocumentVersion | null;
  officialVersion?: DocumentVersion | null;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  revision: string;
  fileName: string;
  filePath: string;
  uploadedBy: string;
  uploadedAt: string;
  isOfficial: boolean;
  status: string;
  notes?: string | null;
}

export interface DocumentDetail extends DocumentSummary {
  versions: DocumentVersion[];
}

export interface ReviewSummary {
  id: string;
  projectId: string;
  deliverableId?: string | null;
  documentId?: string | null;
  documentVersionId?: string | null;
  status: string;
  requestedBy: string;
  reviewers: { userId: string; role: string }[];
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  dueDate?: string | null;
  comment?: string | null;
  decisionComment?: string | null;
  updatedAt?: string;
}

export interface ReviewComment {
  id: string;
  reviewId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId?: string | null;
  actorDisplayName?: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ReviewDetail extends ReviewSummary {
  createdAt?: string;
  comments?: ReviewComment[];
}

export type PriorityTargetType =
  | 'project'
  | 'deliverable'
  | 'review'
  | 'document';

export type PriorityLevel = 'normal' | 'high' | 'urgent';

export type PriorityRequestStatus = 'requested' | 'applied' | 'rejected';

export interface PriorityRequest {
  id: string;
  organizationId: string;
  targetType: PriorityTargetType;
  targetId: string;
  requestedBy: string;
  requestedForUserId?: string | null;
  priority: PriorityLevel;
  reason?: string | null;
  status: PriorityRequestStatus;
  decidedBy?: string | null;
  decidedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
