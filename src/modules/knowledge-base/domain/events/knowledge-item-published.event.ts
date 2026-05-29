import { BaseDomainEvent } from '../../../../shared/domain/events/base-domain-event';

export class KnowledgeItemPublishedEvent extends BaseDomainEvent {
  readonly eventName = 'KnowledgeItemPublished';

  constructor(params: { aggregateId: string; organizationId: string }) {
    super(params);
  }
}
