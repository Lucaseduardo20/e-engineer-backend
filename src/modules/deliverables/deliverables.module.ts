import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { ProjectOrmEntity } from '../projects/infrastructure/persistence/typeorm/project.orm-entity';
import { TechnicalTagOrmEntity } from '../technical-taxonomy/infrastructure/persistence/typeorm/technical-tag.orm-entity';
import { CreateDeliverableUseCase } from './application/use-cases/create-deliverable.use-case';
import { DecideDeliverableRemovalUseCase } from './application/use-cases/decide-deliverable-removal.use-case';
import { DeleteDeliverableUseCase } from './application/use-cases/delete-deliverable.use-case';
import { GetDeliverableUseCase } from './application/use-cases/get-deliverable.use-case';
import { ListDeliverablesUseCase } from './application/use-cases/list-deliverables.use-case';
import { MarkDeliverableInheritanceReviewedUseCase } from './application/use-cases/mark-deliverable-inheritance-reviewed.use-case';
import { RequestDeliverableRemovalUseCase } from './application/use-cases/request-deliverable-removal.use-case';
import { UpdateDeliverableUseCase } from './application/use-cases/update-deliverable.use-case';
import { DeliverableBaseRelationOrmEntity } from '../projects/infrastructure/persistence/typeorm/deliverable-base-relation.orm-entity';
import { DeliverableRemovalRequestOrmEntity } from './infrastructure/persistence/typeorm/deliverable-removal-request.orm-entity';
import { DELIVERABLE_REPOSITORY } from './domain/repositories/deliverable.repository';
import { DeliverableTagOrmEntity } from './infrastructure/persistence/typeorm/deliverable-tag.orm-entity';
import { DeliverableOrmEntity } from './infrastructure/persistence/typeorm/deliverable.orm-entity';
import { TypeOrmDeliverableRepository } from './infrastructure/repositories/deliverable.repository';
import { DeliverablesController } from './presentation/controllers/deliverables.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeliverableOrmEntity,
      DeliverableTagOrmEntity,
      ProjectOrmEntity,
      TechnicalTagOrmEntity,
      DeliverableBaseRelationOrmEntity,
      DeliverableRemovalRequestOrmEntity,
    ]),
    AuditModule,
  ],
  controllers: [DeliverablesController],
  providers: [
    CreateDeliverableUseCase,
    DecideDeliverableRemovalUseCase,
    DeleteDeliverableUseCase,
    GetDeliverableUseCase,
    ListDeliverablesUseCase,
    MarkDeliverableInheritanceReviewedUseCase,
    RequestDeliverableRemovalUseCase,
    UpdateDeliverableUseCase,
    {
      provide: DELIVERABLE_REPOSITORY,
      useClass: TypeOrmDeliverableRepository,
    },
  ],
})
export class DeliverablesModule {}
