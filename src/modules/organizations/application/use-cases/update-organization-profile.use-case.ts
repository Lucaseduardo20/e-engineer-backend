import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import type { Organization } from '../../../../shared/contracts/dashboard.contracts';
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from '../../domain/repositories/organization.repository';
import { OrganizationMapper } from '../../infrastructure/mappers/organization.mapper';

export interface UpdateOrganizationProfileInput {
  organizationId: string;
  name?: string;
  legalName?: string | null;
  logoUrl?: string | null;
}

@Injectable()
export class UpdateOrganizationProfileUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(
    input: UpdateOrganizationProfileInput,
  ): Promise<Result<Organization, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const organization =
        await this.organizationRepository.findById(organizationId);

      if (!organization) {
        throw new Error('Organization not found.');
      }

      organization.updateProfile({
        name: input.name,
        legalName: input.legalName,
      });

      if (input.logoUrl !== undefined) {
        organization.updateLogo(input.logoUrl);
      }

      await this.organizationRepository.save(organization);

      return Result.ok(OrganizationMapper.toContract(organization));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
