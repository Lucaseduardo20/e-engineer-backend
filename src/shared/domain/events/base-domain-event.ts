import { randomUUID } from 'crypto';
import { DomainEvent } from './domain-event';

export abstract class BaseDomainEvent implements DomainEvent {
  readonly eventId: string;
  abstract readonly eventName: string;
  readonly aggregateId: string;
  readonly organizationId?: string;
  readonly occurredAt: Date;

  protected constructor(params: {
    aggregateId: string;
    organizationId?: string;
  }) {
    this.eventId = randomUUID();
    this.aggregateId = params.aggregateId;
    this.organizationId = params.organizationId;
    this.occurredAt = new Date();
  }
}
