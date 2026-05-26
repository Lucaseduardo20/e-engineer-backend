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
  officialRevision?: string | null;
  status: string;
  updatedAt: string;
}

export interface ReviewSummary {
  id: string;
  projectId: string;
  deliverableId?: string | null;
  status: string;
  requestedBy: string;
  reviewedBy?: string | null;
  dueDate?: string | null;
  comment?: string | null;
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
