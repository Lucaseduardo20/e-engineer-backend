import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectOrmEntity } from '../projects/infrastructure/persistence/typeorm/project.orm-entity';
import { KnowledgeBaseQueryService } from './infrastructure/repositories/knowledge-base-query.service';
import { KnowledgeBaseController } from './presentation/controllers/knowledge-base.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectOrmEntity])],
  controllers: [KnowledgeBaseController],
  providers: [KnowledgeBaseQueryService],
})
export class KnowledgeBaseModule {}
