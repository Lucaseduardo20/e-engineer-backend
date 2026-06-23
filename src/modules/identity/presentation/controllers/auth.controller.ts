import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import { JwtAuthGuard } from '../../../../shared/infrastructure/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../../shared/infrastructure/auth/permissions.guard';
import { RequirePermissions } from '../../../../shared/infrastructure/auth/require-permissions.decorator';
import { permissions } from '../../../../shared/application/authorization/permissions';
import {
  ok,
  type ApiResponse,
} from '../../../../shared/presentation/api-response';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { ImpersonateUserUseCase } from '../../application/use-cases/impersonate-user.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { SwitchTenantUseCase } from '../../application/use-cases/switch-tenant.use-case';
import { LoginRequestDto } from '../dto/login.request.dto';
import { LoginResponseDto } from '../dto/login.response.dto';
import { ImpersonateUserRequestDto } from '../dto/impersonate-user.request.dto';
import { RefreshTokenRequestDto } from '../dto/refresh-token.request.dto';
import { RefreshTokenResponseDto } from '../dto/refresh-token.response.dto';
import { SwitchTenantRequestDto } from '../dto/switch-tenant.request.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly switchTenantUseCase: SwitchTenantUseCase,
    private readonly impersonateUserUseCase: ImpersonateUserUseCase,
  ) {}

  @Post('login')
  @ApiOkResponse({ description: 'Autentica usuario e retorna token JWT.' })
  async login(
    @Body() body: LoginRequestDto,
  ): Promise<ApiResponse<LoginResponseDto>> {
    const result = await this.loginUseCase.execute(body);

    if (result.isFail()) {
      throw new UnauthorizedException(result.unwrapError().message);
    }

    return ok(result.unwrap());
  }

  @Post('refresh')
  @ApiOkResponse({ description: 'Renova um token JWT valido.' })
  async refresh(
    @Body() body: RefreshTokenRequestDto,
  ): Promise<ApiResponse<RefreshTokenResponseDto>> {
    const result = await this.refreshTokenUseCase.execute(body);

    if (result.isFail()) {
      throw new UnauthorizedException(result.unwrapError().message);
    }

    return ok(result.unwrap());
  }

  @Post('switch-tenant')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(permissions.platform.tenantSwitch)
  @ApiOkResponse({ description: 'Troca tenant ativo para super-admin.' })
  async switchTenant(
    @Body() body: SwitchTenantRequestDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<LoginResponseDto>> {
    const result = await this.switchTenantUseCase.execute({
      actorUserId: request.user.actorUserId ?? request.user.userId,
      actorOrganizationId:
        request.user.actorOrganizationId ?? request.user.organizationId,
      actorRoles: request.user.roles,
      actorIsPlatformAdmin: request.user.isPlatformAdmin,
      organizationId: body.organizationId,
    });

    if (result.isFail()) {
      throw new ForbiddenException(result.unwrapError().message);
    }

    return ok(result.unwrap());
  }

  @Post('impersonate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(permissions.platform.impersonate)
  @ApiOkResponse({ description: 'Incorpora usuario de tenant para suporte.' })
  async impersonate(
    @Body() body: ImpersonateUserRequestDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<LoginResponseDto>> {
    const result = await this.impersonateUserUseCase.execute({
      actorUserId: request.user.actorUserId ?? request.user.userId,
      actorOrganizationId:
        request.user.actorOrganizationId ?? request.user.organizationId,
      actorRoles: request.user.roles,
      actorIsPlatformAdmin: request.user.isPlatformAdmin,
      userId: body.userId,
      organizationId: body.organizationId,
    });

    if (result.isFail()) {
      throw new ForbiddenException(result.unwrapError().message);
    }

    return ok(result.unwrap());
  }
}
