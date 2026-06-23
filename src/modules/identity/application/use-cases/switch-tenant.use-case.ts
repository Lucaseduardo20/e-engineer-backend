import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../domain/repositories/user.repository';
import { TOKEN_SERVICE, type TokenService } from '../ports/token-service';
import {
  PlatformSessionOutputDto,
  SwitchTenantInputDto,
} from '../dto/platform-session.dto';

@Injectable()
export class SwitchTenantUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(
    input: SwitchTenantInputDto,
  ): Promise<Result<PlatformSessionOutputDto, Error>> {
    try {
      if (!input.actorIsPlatformAdmin) {
        return Result.fail(new Error('Platform admin permission is required.'));
      }

      const actor = await this.userRepository.findByIdGlobal(input.actorUserId);

      if (!actor?.isPlatformAdmin) {
        return Result.fail(new Error('Platform admin user not found.'));
      }

      const organizationId = OrganizationId.create(input.organizationId);
      const roles = await this.userRepository.getMembershipRoles(
        actor.id,
        organizationId,
      );

      const token = this.tokenService.generateToken({
        userId: actor.id,
        organizationId: organizationId.toString(),
        roles,
        isPlatformAdmin: actor.isPlatformAdmin,
        actorUserId: actor.id,
        actorOrganizationId: input.actorOrganizationId,
      });

      return Result.ok({
        token,
        user: {
          id: actor.id,
          fullName: actor.name,
          email: actor.email.toString(),
          avatarUrl: actor.avatarUrl,
          roles,
          isPlatformAdmin: actor.isPlatformAdmin,
          impersonatedBy: null,
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
