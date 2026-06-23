import { BaseDomainEvent } from '../../../../shared/domain/events/base-domain-event';

export class ProjectPromotedToKnowledgeEvent extends BaseDomainEvent {
  readonly eventName = 'ProjectPromotedToKnowledge';

  readonly projectId: string;

  constructor(params: {
    aggregateId: string;
    organizationId: string;
    projectId: string;
  }) {
    super(params);
    this.projectId = params.projectId;
  }
}
