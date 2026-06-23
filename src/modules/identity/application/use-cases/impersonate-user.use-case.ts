import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../domain/repositories/user.repository';
import { TOKEN_SERVICE, type TokenService } from '../ports/token-service';
import {
  ImpersonateUserInputDto,
  PlatformSessionOutputDto,
} from '../dto/platform-session.dto';

@Injectable()
export class ImpersonateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(
    input: ImpersonateUserInputDto,
  ): Promise<Result<PlatformSessionOutputDto, Error>> {
    try {
      if (!input.actorIsPlatformAdmin) {
        return Result.fail(new Error('Platform admin permission is required.'));
      }

      const target = await this.userRepository.findByIdGlobal(input.userId);

      if (!target) {
        return Result.fail(new Error('User not found.'));
      }

      const organizationId = OrganizationId.create(input.organizationId);
      const roles = await this.userRepository.getMembershipRoles(
        target.id,
        organizationId,
      );

      if (roles.length === 0) {
        return Result.fail(new Error('User is not a member of this tenant.'));
      }

      const token = this.tokenService.generateToken({
        userId: target.id,
        organizationId: organizationId.toString(),
        roles,
        isPlatformAdmin: false,
        actorUserId: input.actorUserId,
        actorOrganizationId: input.actorOrganizationId,
        impersonatedUserId: target.id,
      });

      return Result.ok({
        token,
        user: {
          id: target.id,
          fullName: target.name,
          email: target.email.toString(),
          avatarUrl: target.avatarUrl,
          roles,
          isPlatformAdmin: false,
          impersonatedBy: input.actorUserId,
          organizationId: organizationId.toString(),
        },
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
