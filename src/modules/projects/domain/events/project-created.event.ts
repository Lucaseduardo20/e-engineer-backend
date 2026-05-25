import { BaseDomainEvent } from '../../../../shared/domain/events/base-domain-event';

export class ProjectCreatedEvent extends BaseDomainEvent {
  readonly eventName = 'ProjectCreated';

  constructor(params: { projectId: string; organizationId: string }) {
    super({
      aggregateId: params.projectId,
      organizationId: params.organizationId,
    });
  }
}
