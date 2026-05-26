import { BaseDomainEvent } from '../../../../shared/domain/events/base-domain-event';

export class UserCreatedEvent extends BaseDomainEvent {
  readonly eventName = 'UserCreated';

  constructor(params: {
    userId: string;
    organizationId: string;
    email: string;
  }) {
    super({
      aggregateId: params.userId,
      organizationId: params.organizationId,
    });
  }
}
