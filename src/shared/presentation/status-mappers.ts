import type { Deliverable, Project } from '../contracts/dashboard.contracts';

export function mapProjectStatus(status: string): Project['status'] {
  if (status === 'draft' || status === 'planning') {
    return 'draft';
  }

  if (status === 'on_hold' || status === 'waiting_approval') {
    return 'paused';
  }

  if (status === 'completed' || status === 'cancelled') {
    return status === 'completed' ? 'completed' : 'archived';
  }

  return 'active';
}

export function mapDeliverableStatus(status: string): Deliverable['status'] {
  if (status === 'approved') {
    return 'done';
  }

  if (status === 'in_progress' || status === 'in_review') {
    return 'in_progress';
  }

  if (status === 'rejected' || status === 'overdue') {
    return 'blocked';
  }

  return 'todo';
}

export function progressFromStatus(status: string): number {
  const progressByStatus: Record<string, number> = {
    draft: 5,
    planning: 15,
    active: 35,
    in_progress: 48,
    in_review: 68,
    waiting_approval: 78,
    on_hold: 55,
    overdue: 62,
    completed: 100,
    cancelled: 0,
  };

  return progressByStatus[status] ?? 25;
}
