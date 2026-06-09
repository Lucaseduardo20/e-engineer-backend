import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectOrmEntity } from '../projects/infrastructure/persistence/typeorm/project.orm-entity';
import { TechnicalTagOrmEntity } from '../technical-taxonomy/infrastructure/persistence/typeorm/technical-tag.orm-entity';
import { CreateDeliverableUseCase } from './application/use-cases/create-deliverable.use-case';
import { GetDeliverableUseCase } from './application/use-cases/get-deliverable.use-case';
import { ListDeliverablesUseCase } from './application/use-cases/list-deliverables.use-case';
import { UpdateDeliverableUseCase } from './application/use-cases/update-deliverable.use-case';
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
    ]),
  ],
  controllers: [DeliverablesController],
  providers: [
    CreateDeliverableUseCase,
    GetDeliverableUseCase,
    ListDeliverablesUseCase,
    UpdateDeliverableUseCase,
    {
      provide: DELIVERABLE_REPOSITORY,
      useClass: TypeOrmDeliverableRepository,
    },
  ],
})
export class DeliverablesModule {}
