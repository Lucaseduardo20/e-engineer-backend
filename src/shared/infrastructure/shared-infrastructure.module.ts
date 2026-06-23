import { Module } from '@nestjs/common';
import { AuthorizationService } from '../application/authorization/authorization.service';
import { DOMAIN_EVENT_PUBLISHER } from '../application/ports/domain-event-publisher';
import { PermissionsGuard } from './auth/permissions.guard';
import { InProcessDomainEventPublisher } from './events/in-process-domain-event-publisher';

@Module({
  providers: [
    AuthorizationService,
    PermissionsGuard,
    {
      provide: DOMAIN_EVENT_PUBLISHER,
      useClass: InProcessDomainEventPublisher,
    },
  ],
  exports: [AuthorizationService, PermissionsGuard, DOMAIN_EVENT_PUBLISHER],
})
export class SharedInfrastructureModule {}
