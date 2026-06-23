import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import type { User as UserContract } from '../../../../shared/contracts/dashboard.contracts';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../identity/domain/repositories/user.repository';
import { CreateOrganizationMemberUseCase } from './create-organization-member.use-case';
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from '../../domain/repositories/organization.repository';

export interface CloneOrganizationMemberInput {
  organizationId: string;
  actorRoles: string[];
  actorIsPlatformAdmin?: boolean;
  sourceUserId: string;
  fullName: string;
  email: string;
  password: string;
}

@Injectable()
export class CloneOrganizationMemberUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
    private readonly createMemberUseCase: CreateOrganizationMemberUseCase,
  ) {}

  async execute(
    input: CloneOrganizationMemberInput,
  ): Promise<Result<UserContract, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const sourceUser = await this.userRepository.findByIdGlobal(
        input.sourceUserId,
      );
      const sourceRole = await this.organizationRepository.getMemberRole({
        organizationId,
        userId: input.sourceUserId,
      });

      if (
        !sourceUser ||
        !sourceRole ||
        !sourceUser.organizationId.equals(organizationId)
      ) {
        throw new Error('Source member not found.');
      }

      if (sourceUser.email.toString() === input.email.trim().toLowerCase()) {
        throw new Error('Clone email must be different.');
      }

      return this.createMemberUseCase.execute({
        organizationId: input.organizationId,
        actorRoles: input.actorRoles,
        actorIsPlatformAdmin: input.actorIsPlatformAdmin,
        fullName: input.fullName,
        email: input.email,
        password: input.password,
        role: sourceRole,
        avatarUrl: sourceUser.avatarUrl,
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
