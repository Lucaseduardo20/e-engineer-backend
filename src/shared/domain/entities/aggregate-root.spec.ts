import { BaseDomainEvent } from '../events/base-domain-event';
import { AggregateRoot } from './aggregate-root';

class TestEvent extends BaseDomainEvent {
  readonly eventName = 'TestEvent';

  constructor(aggregateId: string) {
    super({ aggregateId });
  }
}

class TestAggregate extends AggregateRoot<{ name: string }> {
  constructor() {
    super({ name: 'technical project' });
  }

  recordSomething(): void {
    this.addDomainEvent(new TestEvent(this.getId().toString()));
  }
}

describe('AggregateRoot', () => {
  it('pulls and clears domain events', () => {
    const aggregate = new TestAggregate();

    aggregate.recordSomething();

    const events = aggregate.pullDomainEvents();

    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('TestEvent');
    expect(aggregate.pullDomainEvents()).toHaveLength(0);
  });
});
