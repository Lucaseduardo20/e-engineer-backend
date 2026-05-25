import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedInfrastructureModule } from '../../shared/infrastructure/shared-infrastructure.module';
import { CreateProjectUseCase } from './application/use-cases/create-project.use-case';
import { PROJECT_REPOSITORY } from './domain/repositories/project.repository';
import { ProjectOrmEntity } from './infrastructure/persistence/typeorm/project.orm-entity';
import { TypeOrmProjectRepository } from './infrastructure/persistence/typeorm/typeorm-project.repository';
import { ProjectsController } from './presentation/controllers/projects.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectOrmEntity]),
    SharedInfrastructureModule,
  ],
  controllers: [ProjectsController],
  providers: [
    CreateProjectUseCase,
    {
      provide: PROJECT_REPOSITORY,
      useClass: TypeOrmProjectRepository,
    },
  ],
})
export class ProjectsModule {}
