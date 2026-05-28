import {
  Controller,
  Get,
  NotFoundException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/infrastructure/auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import {
  ok,
  type ApiResponse,
} from '../../../../shared/presentation/api-response';
import type {
  Organization,
  User,
} from '../../../../shared/contracts/dashboard.contracts';
import { GetCurrentOrganizationUseCase } from '../../application/use-cases/get-current-organization.use-case';
import { ListOrganizationUsersUseCase } from '../../application/use-cases/list-organization-users.use-case';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly getCurrentOrganizationUseCase: GetCurrentOrganizationUseCase,
    private readonly listOrganizationUsersUseCase: ListOrganizationUsersUseCase,
  ) {}

  @Get('current')
  @ApiOkResponse({ description: 'Organizacao atual do usuario autenticado.' })
  async current(
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<Organization>> {
    const organization = await this.getCurrentOrganizationUseCase.execute({
      organizationId: request.user.organizationId,
    });

    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }

    return ok(organization);
  }

  @Get('current/users')
  @ApiOkResponse({ description: 'Usuarios da organizacao atual.' })
  async users(
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<User[]>> {
    return ok(
      await this.listOrganizationUsersUseCase.execute({
        organizationId: request.user.organizationId,
      }),
    );
  }
}
