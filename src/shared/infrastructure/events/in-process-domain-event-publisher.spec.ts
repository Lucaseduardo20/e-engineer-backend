import { randomUUID } from 'crypto';
import { BaseDomainEvent } from '../../domain/events/base-domain-event';
import { InProcessDomainEventPublisher } from './in-process-domain-event-publisher';

class TestEvent extends BaseDomainEvent {
  readonly eventName = 'TestEvent';

  constructor(aggregateId: string) {
    super({ aggregateId });
  }
}

describe('InProcessDomainEventPublisher', () => {
  it('publishes registered handlers for an event name', async () => {
    const publisher = new InProcessDomainEventPublisher();
    const handler = {
      handle: jest.fn(),
    };
    const event = new TestEvent(randomUUID());

    publisher.register('TestEvent', handler);

    await publisher.publish(event);

    expect(handler.handle).toHaveBeenCalledWith(event);
  });
});
