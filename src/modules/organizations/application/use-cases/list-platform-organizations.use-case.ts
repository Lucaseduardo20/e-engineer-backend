import { Inject, Injectable } from '@nestjs/common';
import type { Organization } from '../../../../shared/contracts/dashboard.contracts';
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from '../../domain/repositories/organization.repository';

@Injectable()
export class ListPlatformOrganizationsUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  execute(): Promise<Organization[]> {
    return this.organizationRepository.listAll();
  }
}
