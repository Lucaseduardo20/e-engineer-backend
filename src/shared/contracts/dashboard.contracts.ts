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
  tags?: string[];
  metrics?: Record<string, number>;
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
  attachments?: { url: string; name: string }[];
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
