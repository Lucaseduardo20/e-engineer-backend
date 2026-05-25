import { DomainEvent } from './domain-event';

export interface DomainEventHandler<TEvent extends DomainEvent = DomainEvent> {
  handle(event: TEvent): Promise<void> | void;
}
