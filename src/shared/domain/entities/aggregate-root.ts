import { Entity } from './entity';
import { DomainEvent } from '../events/domain-event';

export abstract class AggregateRoot<TProps> extends Entity<TProps> {
  private readonly domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;

    return events;
  }
}
