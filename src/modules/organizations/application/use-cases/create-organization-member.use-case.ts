import { Inject, Injectable } from '@nestjs/common';
import { AuthorizationService } from '../../../../shared/application/authorization/authorization.service';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import type { User as UserContract } from '../../../../shared/contracts/dashboard.contracts';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../identity/domain/repositories/user.repository';
import { User } from '../../../identity/domain/entities/user';
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from '../../domain/repositories/organization.repository';
import { OrganizationRole } from '../../domain/value-objects/organization-role';

export interface CreateOrganizationMemberInput {
  organizationId: string;
  actorRoles: string[];
  actorIsPlatformAdmin?: boolean;
  fullName: string;
  email: string;
  password: string;
  role: string;
  avatarUrl?: string | null;
}

@Injectable()
export class CreateOrganizationMemberUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    input: CreateOrganizationMemberInput,
  ): Promise<Result<UserContract, Error>> {
    try {
      const role = OrganizationRole.create(input.role).value;

      if (
        !this.authorizationService.canManageRole(
          {
            roles: input.actorRoles,
            isPlatformAdmin: input.actorIsPlatformAdmin,
          },
          role,
        )
      ) {
        throw new Error('Insufficient role hierarchy.');
      }

      const existingUser = await this.userRepository.findByEmail(input.email);

      if (existingUser) {
        throw new Error('User email already exists.');
      }

      const organizationId = OrganizationId.create(input.organizationId);
      const user = User.create({
        organizationId,
        email: input.email,
        password: input.password,
        name: input.fullName,
        avatarUrl: input.avatarUrl,
      });

      await this.userRepository.save(user);
      await this.organizationRepository.addMember({
        organizationId,
        userId: user.id,
        role,
      });

      return Result.ok({
        id: user.id,
        fullName: user.name,
        email: user.email.toString(),
        avatarUrl: user.avatarUrl,
        roles: [role],
        isPlatformAdmin: user.isPlatformAdmin,
        organizationId: organizationId.toString(),
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
