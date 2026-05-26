import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditQueryService } from './infrastructure/repositories/audit-query.service';
import { ActivityLogOrmEntity } from './infrastructure/persistence/typeorm/activity-log.orm-entity';
import { AuditController } from './presentation/controllers/audit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLogOrmEntity])],
  controllers: [AuditController],
  providers: [AuditQueryService],
  exports: [AuditQueryService],
})
export class AuditModule {}
