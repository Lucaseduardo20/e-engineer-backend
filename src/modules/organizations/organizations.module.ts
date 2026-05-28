import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from '../identity/infrastructure/persistence/typeorm/user.orm-entity';
import { GetCurrentOrganizationUseCase } from './application/use-cases/get-current-organization.use-case';
import { ListOrganizationUsersUseCase } from './application/use-cases/list-organization-users.use-case';
import { ORGANIZATION_REPOSITORY } from './domain/repositories/organization.repository';
import { OrganizationOrmEntity } from './infrastructure/persistence/typeorm/organization.orm-entity';
import { TypeOrmOrganizationRepository } from './infrastructure/persistence/typeorm/typeorm-organization.repository';
import { OrganizationsController } from './presentation/controllers/organizations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationOrmEntity, UserOrmEntity])],
  controllers: [OrganizationsController],
  providers: [
    GetCurrentOrganizationUseCase,
    ListOrganizationUsersUseCase,
    {
      provide: ORGANIZATION_REPOSITORY,
      useClass: TypeOrmOrganizationRepository,
    },
  ],
})
export class OrganizationsModule {}
