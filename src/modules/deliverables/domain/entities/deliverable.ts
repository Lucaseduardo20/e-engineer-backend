import { AggregateRoot } from '../../../../shared/domain/entities/aggregate-root';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { DeliverableStatus } from '../value-objects/deliverable-status.value-object';
import { DeliverableType } from '../value-objects/deliverable-type.value-object';

export interface DeliverableProps {
  organizationId: OrganizationId;
  projectId: UniqueEntityId;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: DeliverableStatus;
  type: DeliverableType;
  assignees: string[];
}

export class Deliverable extends AggregateRoot<DeliverableProps> {
  private constructor(props: DeliverableProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(params: {
    organizationId: OrganizationId;
    projectId: UniqueEntityId;
    title: string;
    description?: string | null;
    dueDate?: string | null;
    status?: DeliverableStatus;
    type: DeliverableType;
    assignees?: string[];
  }): Deliverable {
    return new Deliverable({
      organizationId: params.organizationId,
      projectId: params.projectId,
      title: this.normalizeTitle(params.title),
      description: this.normalizeOptionalText(params.description),
      dueDate: this.normalizeDueDate(params.dueDate),
      status: params.status ?? DeliverableStatus.todo(),
      type: params.type,
      assignees: this.normalizeAssignees(params.assignees ?? []),
    });
  }

  static restore(props: DeliverableProps, id: UniqueEntityId): Deliverable {
    return new Deliverable(
      {
        ...props,
        title: this.normalizeTitle(props.title),
        description: this.normalizeOptionalText(props.description),
        dueDate: this.normalizeDueDate(props.dueDate),
        assignees: this.normalizeAssignees(props.assignees),
      },
      id,
    );
  }

  update(params: {
    title?: string;
    description?: string | null;
    dueDate?: string | null;
    status?: DeliverableStatus;
    type?: DeliverableType;
    assignees?: string[];
  }): void {
    if (params.title !== undefined) {
      this.props.title = Deliverable.normalizeTitle(params.title);
    }

    if (params.description !== undefined) {
      this.props.description = Deliverable.normalizeOptionalText(
        params.description,
      );
    }

    if (params.dueDate !== undefined) {
      this.props.dueDate = Deliverable.normalizeDueDate(params.dueDate);
    }

    if (params.status) {
      this.props.status = params.status;
    }

    if (params.type) {
      this.props.type = params.type;
    }

    if (params.assignees !== undefined) {
      this.props.assignees = Deliverable.normalizeAssignees(params.assignees);
    }
  }

  get id(): string {
    return this.getId().toString();
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }

  get projectId(): UniqueEntityId {
    return this.props.projectId;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | null {
    return this.props.description ?? null;
  }

  get dueDate(): string | null {
    return this.props.dueDate ?? null;
  }

  get status(): DeliverableStatus {
    return this.props.status;
  }

  get type(): DeliverableType {
    return this.props.type;
  }

  get assignees(): string[] {
    return [...this.props.assignees];
  }

  private static normalizeTitle(value: string): string {
    const title = value.trim();

    if (!title) {
      throw new Error('Deliverable title is required.');
    }

    if (title.length > 160) {
      throw new Error('Deliverable title must have at most 160 characters.');
    }

    return title;
  }

  private static normalizeOptionalText(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const text = value.trim();
    return text.length ? text : null;
  }

  private static normalizeDueDate(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
      throw new Error('Deliverable due date must be a valid ISO date.');
    }

    return value;
  }

  private static normalizeAssignees(values: string[]): string[] {
    const assignees = values
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 12);

    return [...new Set(assignees)];
  }
}
