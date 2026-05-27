export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  roles: string[];
  organizationId?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  organizationId: string;
  startDate?: string;
  endDate?: string;
  progress: number;
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

export interface AuditLogEntry {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
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
}
