import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from '../identity/infrastructure/persistence/typeorm/user.orm-entity';
import { USER_REPOSITORY } from '../identity/domain/repositories/user.repository';
import { TypeOrmUserRepository } from '../identity/infrastructure/persistence/typeorm/typeorm-user.repository';
import { SharedInfrastructureModule } from '../../shared/infrastructure/shared-infrastructure.module';
import { CreateOrganizationMemberUseCase } from './application/use-cases/create-organization-member.use-case';
import { UpdateOrganizationMemberUseCase } from './application/use-cases/update-organization-member.use-case';
import { CloneOrganizationMemberUseCase } from './application/use-cases/clone-organization-member.use-case';
import { GetCurrentOrganizationUseCase } from './application/use-cases/get-current-organization.use-case';
import { ListOrganizationUsersUseCase } from './application/use-cases/list-organization-users.use-case';
import { ListPlatformOrganizationsUseCase } from './application/use-cases/list-platform-organizations.use-case';
import { UpdateOrganizationProfileUseCase } from './application/use-cases/update-organization-profile.use-case';
import { ORGANIZATION_REPOSITORY } from './domain/repositories/organization.repository';
import { OrganizationOrmEntity } from './infrastructure/persistence/typeorm/organization.orm-entity';
import { TypeOrmOrganizationRepository } from './infrastructure/persistence/typeorm/typeorm-organization.repository';
import { OrganizationAssetStorageService } from './infrastructure/storage/organization-asset-storage.service';
import { OrganizationsController } from './presentation/controllers/organizations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganizationOrmEntity, UserOrmEntity]),
    SharedInfrastructureModule,
  ],
  controllers: [OrganizationsController],
  providers: [
    GetCurrentOrganizationUseCase,
    ListOrganizationUsersUseCase,
    ListPlatformOrganizationsUseCase,
    UpdateOrganizationProfileUseCase,
    CreateOrganizationMemberUseCase,
    UpdateOrganizationMemberUseCase,
    CloneOrganizationMemberUseCase,
    OrganizationAssetStorageService,
    {
      provide: ORGANIZATION_REPOSITORY,
      useClass: TypeOrmOrganizationRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
  ],
})
export class OrganizationsModule {}
