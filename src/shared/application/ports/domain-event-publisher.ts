import { DomainEvent } from '../../domain/events/domain-event';
import { DomainEventHandler } from '../../domain/events/domain-event-handler';

export const DOMAIN_EVENT_PUBLISHER = Symbol('DOMAIN_EVENT_PUBLISHER');

export interface DomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
  register<TEvent extends DomainEvent>(
    eventName: TEvent['eventName'],
    handler: DomainEventHandler<TEvent>,
  ): void;
}
