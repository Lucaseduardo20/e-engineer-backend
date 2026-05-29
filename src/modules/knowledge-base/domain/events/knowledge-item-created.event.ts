import { BaseDomainEvent } from '../../../../shared/domain/events/base-domain-event';

export class KnowledgeItemCreatedEvent extends BaseDomainEvent {
  readonly eventName = 'KnowledgeItemCreated';

  constructor(params: { aggregateId: string; organizationId: string }) {
    super(params);
  }
}
