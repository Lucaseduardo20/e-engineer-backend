import { Injectable } from '@nestjs/common';
import { DomainEventPublisher } from '../../application/ports/domain-event-publisher';
import { DomainEvent } from '../../domain/events/domain-event';
import { DomainEventHandler } from '../../domain/events/domain-event-handler';

@Injectable()
export class InProcessDomainEventPublisher implements DomainEventPublisher {
  private readonly handlers = new Map<string, DomainEventHandler[]>();

  register<TEvent extends DomainEvent>(
    eventName: TEvent['eventName'],
    handler: DomainEventHandler<TEvent>,
  ): void {
    const eventHandlers = this.handlers.get(eventName) ?? [];
    eventHandlers.push(handler);
    this.handlers.set(eventName, eventHandlers);
  }

  async publish(event: DomainEvent): Promise<void> {
    const eventHandlers = this.handlers.get(event.eventName) ?? [];

    for (const handler of eventHandlers) {
      await handler.handle(event);
    }
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
