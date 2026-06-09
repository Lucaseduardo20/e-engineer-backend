import type { DeliverableTypeValue } from '../../domain/value-objects/deliverable-type.value-object';
import type { DeliverableStatusValue } from '../../domain/value-objects/deliverable-status.value-object';

export class DeliverableResponseDto {
  id!: string;
  projectId!: string;
  title!: string;
  description?: string;
  dueDate?: string;
  status!: DeliverableStatusValue;
  type!: DeliverableTypeValue;
  assignees!: string[];
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
