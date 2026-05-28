import { AggregateRoot } from '../../../../shared/domain/entities/aggregate-root';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { InvalidProjectNameError } from '../errors/invalid-project-name.error';
import { InvalidProjectTypeError } from '../errors/invalid-project-type.error';
import { ProjectCreatedEvent } from '../events/project-created.event';
import { ProjectStatus } from '../value-objects/project-status';

export interface ProjectProps {
  organizationId: OrganizationId;
  name: string;
  projectType: string;
  status: ProjectStatus;
}

export class Project extends AggregateRoot<ProjectProps> {
  private constructor(props: ProjectProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(params: {
    organizationId: OrganizationId;
    name: string;
    projectType: string;
  }): Project {
    const name = params.name.trim();
    const projectType = params.projectType.trim();

    if (!name) {
      throw new InvalidProjectNameError();
    }

    if (!projectType) {
      throw new InvalidProjectTypeError();
    }

    const project = new Project({
      organizationId: params.organizationId,
      name,
      projectType,
      status: ProjectStatus.draft(),
    });

    project.addDomainEvent(
      new ProjectCreatedEvent({
        projectId: project.id,
        organizationId: project.organizationId.toString(),
      }),
    );

    return project;
  }

  static restore(props: ProjectProps, id: UniqueEntityId): Project {
    return new Project(props, id);
  }

  get id(): string {
    return this.getId().toString();
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }

  get name(): string {
    return this.props.name;
  }

  get projectType(): string {
    return this.props.projectType;
  }

  get status(): ProjectStatus {
    return this.props.status;
  }

  updateStatus(status: ProjectStatus): void {
    this.props.status = status;
  }
}
