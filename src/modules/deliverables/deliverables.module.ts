import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliverableQueryService } from './infrastructure/repositories/deliverable-query.service';
import { DeliverableOrmEntity } from './infrastructure/persistence/typeorm/deliverable.orm-entity';
import { DeliverablesController } from './presentation/controllers/deliverables.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DeliverableOrmEntity])],
  controllers: [DeliverablesController],
  providers: [DeliverableQueryService],
})
export class DeliverablesModule {}
