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
import { ok } from '../../../../shared/presentation/api-response';
import { OrganizationQueryService } from '../../infrastructure/repositories/organization-query.service';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationQuery: OrganizationQueryService) {}

  @Get('current')
  @ApiOkResponse({ description: 'Organizacao atual do usuario autenticado.' })
  async current(@Req() request: AuthenticatedRequest) {
    const organization = await this.organizationQuery.getById(
      request.user.organizationId,
    );

    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }

    return ok(organization);
  }

  @Get('current/users')
  @ApiOkResponse({ description: 'Usuarios da organizacao atual.' })
  async users(@Req() request: AuthenticatedRequest) {
    return ok(
      await this.organizationQuery.listUsers(request.user.organizationId),
    );
  }
}
