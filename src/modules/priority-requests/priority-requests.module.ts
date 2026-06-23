import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedInfrastructureModule } from '../../shared/infrastructure/shared-infrastructure.module';
import { CreatePriorityRequestUseCase } from './application/use-cases/create-priority-request.use-case';
import { DecidePriorityRequestUseCase } from './application/use-cases/decide-priority-request.use-case';
import { ListPriorityRequestsUseCase } from './application/use-cases/list-priority-requests.use-case';
import { PRIORITY_REQUEST_REPOSITORY } from './domain/repositories/priority-request.repository';
import { PriorityRequestOrmEntity } from './infrastructure/persistence/typeorm/priority-request.orm-entity';
import { TypeOrmPriorityRequestRepository } from './infrastructure/persistence/typeorm/typeorm-priority-request.repository';
import { PriorityRequestsController } from './presentation/controllers/priority-requests.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PriorityRequestOrmEntity]),
    SharedInfrastructureModule,
  ],
  controllers: [PriorityRequestsController],
  providers: [
    CreatePriorityRequestUseCase,
    ListPriorityRequestsUseCase,
    DecidePriorityRequestUseCase,
    {
      provide: PRIORITY_REQUEST_REPOSITORY,
      useClass: TypeOrmPriorityRequestRepository,
    },
  ],
})
export class PriorityRequestsModule {}
