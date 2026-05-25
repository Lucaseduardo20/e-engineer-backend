import { Module } from '@nestjs/common';
import { DOMAIN_EVENT_PUBLISHER } from '../application/ports/domain-event-publisher';
import { InProcessDomainEventPublisher } from './events/in-process-domain-event-publisher';

@Module({
  providers: [
    {
      provide: DOMAIN_EVENT_PUBLISHER,
      useClass: InProcessDomainEventPublisher,
    },
  ],
  exports: [DOMAIN_EVENT_PUBLISHER],
})
export class SharedInfrastructureModule {}
