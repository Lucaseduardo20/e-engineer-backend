import { BaseDomainEvent } from '../../../../shared/domain/events/base-domain-event';

export class KnowledgeItemDeprecatedEvent extends BaseDomainEvent {
  readonly eventName = 'KnowledgeItemDeprecated';

  constructor(params: {
    aggregateId: string;
    organizationId: string;
    userId: string;
  }) {
    super(params);
  }
}
