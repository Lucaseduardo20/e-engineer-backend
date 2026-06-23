import { Inject, Injectable } from '@nestjs/common';
import { AuthorizationService } from '../../../../shared/application/authorization/authorization.service';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import type { User as UserContract } from '../../../../shared/contracts/dashboard.contracts';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../identity/domain/repositories/user.repository';
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from '../../domain/repositories/organization.repository';
import { OrganizationRole } from '../../domain/value-objects/organization-role';

export interface UpdateOrganizationMemberInput {
  organizationId: string;
  actorUserId: string;
  actorRoles: string[];
  actorIsPlatformAdmin?: boolean;
  userId: string;
  fullName?: string;
  email?: string;
  password?: string;
  role?: string;
  avatarUrl?: string | null;
}

@Injectable()
export class UpdateOrganizationMemberUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    input: UpdateOrganizationMemberInput,
  ): Promise<Result<UserContract, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const currentRole = await this.organizationRepository.getMemberRole({
        organizationId,
        userId: input.userId,
      });

      if (!currentRole) {
        throw new Error('Member not found.');
      }

      if (!this.canManage(input, currentRole)) {
        throw new Error('Insufficient role hierarchy.');
      }

      const user = await this.userRepository.findByIdGlobal(input.userId);

      if (!user || !user.organizationId.equals(organizationId)) {
        throw new Error('Member not found.');
      }

      if (input.email !== undefined) {
        const existingUser = await this.userRepository.findByEmail(input.email);

        if (existingUser && existingUser.id !== user.id) {
          throw new Error('User email already exists.');
        }
      }

      user.updateProfile({
        name: input.fullName,
        email: input.email,
        avatarUrl: input.avatarUrl,
      });

      if (input.password) {
        user.updatePassword(input.password);
      }

      const nextRole = input.role
        ? OrganizationRole.create(input.role).value
        : currentRole;

      if (input.role && !this.canManage(input, nextRole)) {
        throw new Error('Insufficient role hierarchy.');
      }

      await this.userRepository.save(user);

      if (nextRole !== currentRole) {
        await this.organizationRepository.updateMemberRole({
          organizationId,
          userId: user.id,
          role: nextRole,
        });
      }

      return Result.ok({
        id: user.id,
        fullName: user.name,
        email: user.email.toString(),
        avatarUrl: user.avatarUrl,
        roles: [nextRole],
        isPlatformAdmin: user.isPlatformAdmin,
        organizationId: organizationId.toString(),
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  private canManage(
    input: UpdateOrganizationMemberInput,
    targetRole: string,
  ): boolean {
    if (input.actorUserId === input.userId && input.role === undefined) {
      return true;
    }

    return this.authorizationService.canManageRole(
      {
        roles: input.actorRoles,
        isPlatformAdmin: input.actorIsPlatformAdmin,
      },
      targetRole,
    );
  }
}
