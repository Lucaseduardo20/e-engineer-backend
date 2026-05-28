import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedInfrastructureModule } from '../../shared/infrastructure/shared-infrastructure.module';
import { AuditModule } from '../audit/audit.module';
import { CreateProjectUseCase } from './application/use-cases/create-project.use-case';
import { GetProjectDetailUseCase } from './application/use-cases/get-project-detail.use-case';
import { ListProjectsUseCase } from './application/use-cases/list-projects.use-case';
import { UpdateProjectStatusUseCase } from './application/use-cases/update-project-status.use-case';
import { PROJECT_REPOSITORY } from './domain/repositories/project.repository';
import { ProjectOrmEntity } from './infrastructure/persistence/typeorm/project.orm-entity';
import { TypeOrmProjectRepository } from './infrastructure/persistence/typeorm/typeorm-project.repository';
import { ProjectsController } from './presentation/controllers/projects.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectOrmEntity]),
    SharedInfrastructureModule,
    AuditModule,
  ],
  controllers: [ProjectsController],
  providers: [
    CreateProjectUseCase,
    GetProjectDetailUseCase,
    ListProjectsUseCase,
    UpdateProjectStatusUseCase,
    {
      provide: PROJECT_REPOSITORY,
      useClass: TypeOrmProjectRepository,
    },
  ],
})
export class ProjectsModule {}
