import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import type { Organization } from '../../../../shared/contracts/dashboard.contracts';
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from '../../domain/repositories/organization.repository';

@Injectable()
export class GetCurrentOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  execute(input: { organizationId: string }): Promise<Organization | null> {
    return this.organizationRepository.getById(
      OrganizationId.create(input.organizationId),
    );
  }
}
