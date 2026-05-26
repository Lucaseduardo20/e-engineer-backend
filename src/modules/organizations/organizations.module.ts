import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from '../identity/infrastructure/persistence/typeorm/user.orm-entity';
import { OrganizationQueryService } from './infrastructure/repositories/organization-query.service';
import { OrganizationOrmEntity } from './infrastructure/persistence/typeorm/organization.orm-entity';
import { OrganizationsController } from './presentation/controllers/organizations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationOrmEntity, UserOrmEntity])],
  controllers: [OrganizationsController],
  providers: [OrganizationQueryService],
})
export class OrganizationsModule {}
