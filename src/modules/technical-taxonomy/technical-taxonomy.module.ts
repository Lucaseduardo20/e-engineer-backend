import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedInfrastructureModule } from '../../shared/infrastructure/shared-infrastructure.module';
import { ArchiveTechnicalTagUseCase } from './application/use-cases/archive-technical-tag.use-case';
import { CreateTechnicalTagUseCase } from './application/use-cases/create-technical-tag.use-case';
import { DeprecateTechnicalTagUseCase } from './application/use-cases/deprecate-technical-tag.use-case';
import { GetTechnicalTagDetailsUseCase } from './application/use-cases/get-technical-tag-details.use-case';
import { ListTechnicalTagsUseCase } from './application/use-cases/list-technical-tags.use-case';
import { UpdateTechnicalTagUseCase } from './application/use-cases/update-technical-tag.use-case';
import { TECHNICAL_TAG_REPOSITORY } from './domain/repositories/technical-tag.repository';
import { TechnicalTagOrmEntity } from './infrastructure/persistence/typeorm/technical-tag.orm-entity';
import { TypeOrmTechnicalTagRepository } from './infrastructure/repositories/technical-tag.repository';
import { TechnicalTagsController } from './presentation/controllers/technical-tags.controller';

@Module({
  imports: [SharedInfrastructureModule, TypeOrmModule.forFeature([TechnicalTagOrmEntity])],
  controllers: [TechnicalTagsController],
  providers: [
    CreateTechnicalTagUseCase,
    ListTechnicalTagsUseCase,
    GetTechnicalTagDetailsUseCase,
    UpdateTechnicalTagUseCase,
    ArchiveTechnicalTagUseCase,
    DeprecateTechnicalTagUseCase,
    {
      provide: TECHNICAL_TAG_REPOSITORY,
      useClass: TypeOrmTechnicalTagRepository,
    },
  ],
  exports: [TECHNICAL_TAG_REPOSITORY, TypeOrmModule],
})
export class TechnicalTaxonomyModule {}
