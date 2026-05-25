export interface DomainEvent {
  readonly eventId: string;
  readonly eventName: string;
  readonly aggregateId: string;
  readonly organizationId?: string;
  readonly occurredAt: Date;
}
