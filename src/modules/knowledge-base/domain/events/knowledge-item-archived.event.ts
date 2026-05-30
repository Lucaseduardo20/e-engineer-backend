import { BaseDomainEvent } from '../../../../shared/domain/events/base-domain-event';

export class KnowledgeItemArchivedEvent extends BaseDomainEvent {
  readonly eventName = 'KnowledgeItemArchived';

  constructor(params: {
    aggregateId: string;
    organizationId: string;
    userId: string;
  }) {
    super(params);
  }
}
