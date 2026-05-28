import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import type { User } from '../../../../shared/contracts/dashboard.contracts';
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from '../../domain/repositories/organization.repository';

@Injectable()
export class ListOrganizationUsersUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  execute(input: { organizationId: string }): Promise<User[]> {
    return this.organizationRepository.listUsers(
      OrganizationId.create(input.organizationId),
    );
  }
}
