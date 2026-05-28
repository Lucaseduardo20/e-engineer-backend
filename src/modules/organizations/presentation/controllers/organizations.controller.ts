import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { permissions } from '../../../../shared/application/authorization/permissions';
import { JwtAuthGuard } from '../../../../shared/infrastructure/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../../shared/infrastructure/auth/permissions.guard';
import { RequirePermissions } from '../../../../shared/infrastructure/auth/require-permissions.decorator';
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
import { ListPlatformOrganizationsUseCase } from '../../application/use-cases/list-platform-organizations.use-case';
import { UpdateOrganizationProfileUseCase } from '../../application/use-cases/update-organization-profile.use-case';
import { CreateOrganizationMemberUseCase } from '../../application/use-cases/create-organization-member.use-case';
import { UpdateOrganizationMemberUseCase } from '../../application/use-cases/update-organization-member.use-case';
import { CloneOrganizationMemberUseCase } from '../../application/use-cases/clone-organization-member.use-case';
import { OrganizationAssetStorageService } from '../../infrastructure/storage/organization-asset-storage.service';
import { UpdateOrganizationProfileDto } from '../dto/update-organization-profile.dto';
import { CreateOrganizationMemberDto } from '../dto/create-organization-member.dto';
import { UpdateOrganizationMemberDto } from '../dto/update-organization-member.dto';
import { CloneOrganizationMemberDto } from '../dto/clone-organization-member.dto';

interface UploadedImageFile {
  originalname: string;
  mimetype?: string;
  size: number;
  buffer: Buffer;
}

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly getCurrentOrganizationUseCase: GetCurrentOrganizationUseCase,
    private readonly listOrganizationUsersUseCase: ListOrganizationUsersUseCase,
    private readonly listPlatformOrganizationsUseCase: ListPlatformOrganizationsUseCase,
    private readonly updateOrganizationProfileUseCase: UpdateOrganizationProfileUseCase,
    private readonly createOrganizationMemberUseCase: CreateOrganizationMemberUseCase,
    private readonly updateOrganizationMemberUseCase: UpdateOrganizationMemberUseCase,
    private readonly cloneOrganizationMemberUseCase: CloneOrganizationMemberUseCase,
    private readonly assetStorage: OrganizationAssetStorageService,
  ) {}

  @Get()
  @RequirePermissions(permissions.platform.tenantsRead)
  @ApiOkResponse({ description: 'Lista tenants para super-admin.' })
  async listTenants(): Promise<ApiResponse<Organization[]>> {
    return ok(await this.listPlatformOrganizationsUseCase.execute());
  }

  @Get('current')
  @RequirePermissions(permissions.organization.read)
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
  @RequirePermissions(permissions.organization.membersRead)
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

  @Patch('current')
  @RequirePermissions(permissions.organization.updateProfile)
  @ApiOkResponse({ description: 'Atualiza perfil da organizacao atual.' })
  async updateCurrent(
    @Body() body: UpdateOrganizationProfileDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<Organization>> {
    const result = await this.updateOrganizationProfileUseCase.execute({
      organizationId: request.user.organizationId,
      name: body.name,
      legalName: body.legalName,
      logoUrl: body.logoUrl,
    });

    if (result.isFail()) {
      throw new BadRequestException(result.unwrapError().message);
    }

    return ok(result.unwrap());
  }

  @Post('current/logo')
  @RequirePermissions(permissions.organization.updateLogo)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Atualiza logo da organizacao atual.' })
  async uploadLogo(
    @UploadedFile() file: UploadedImageFile | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<Organization>> {
    this.assertImage(file);

    const logoUrl = await this.assetStorage.upload({
      organizationId: request.user.organizationId,
      kind: 'logo',
      ownerId: request.user.organizationId,
      fileName: file.originalname,
      contentType: file.mimetype,
      buffer: file.buffer,
    });

    const result = await this.updateOrganizationProfileUseCase.execute({
      organizationId: request.user.organizationId,
      logoUrl,
    });

    if (result.isFail()) {
      throw new BadRequestException(result.unwrapError().message);
    }

    return ok(result.unwrap());
  }

  @Post('current/users')
  @RequirePermissions(permissions.organization.membersManage)
  @ApiOkResponse({ description: 'Cria colaborador na organizacao atual.' })
  async createMember(
    @Body() body: CreateOrganizationMemberDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<User>> {
    const result = await this.createOrganizationMemberUseCase.execute({
      organizationId: request.user.organizationId,
      actorRoles: request.user.roles,
      actorIsPlatformAdmin: request.user.isPlatformAdmin,
      fullName: body.fullName,
      email: body.email,
      password: body.password,
      role: body.role,
      avatarUrl: body.avatarUrl,
    });

    if (result.isFail()) {
      throw new BadRequestException(result.unwrapError().message);
    }

    return ok(result.unwrap());
  }

  @Patch('current/users/:userId')
  @RequirePermissions(permissions.organization.membersManage)
  @ApiOkResponse({ description: 'Atualiza colaborador da organizacao atual.' })
  async updateMember(
    @Param('userId') userId: string,
    @Body() body: UpdateOrganizationMemberDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<User>> {
    const result = await this.updateOrganizationMemberUseCase.execute({
      organizationId: request.user.organizationId,
      actorUserId: request.user.userId,
      actorRoles: request.user.roles,
      actorIsPlatformAdmin: request.user.isPlatformAdmin,
      userId,
      fullName: body.fullName,
      email: body.email,
      password: body.password,
      role: body.role,
      avatarUrl: body.avatarUrl,
    });

    if (result.isFail()) {
      throw new BadRequestException(result.unwrapError().message);
    }

    return ok(result.unwrap());
  }

  @Post('current/users/:userId/avatar')
  @RequirePermissions(permissions.organization.membersManage)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Atualiza foto do colaborador.' })
  async uploadMemberAvatar(
    @Param('userId') userId: string,
    @UploadedFile() file: UploadedImageFile | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<User>> {
    this.assertImage(file);

    const avatarUrl = await this.assetStorage.upload({
      organizationId: request.user.organizationId,
      kind: 'avatar',
      ownerId: userId,
      fileName: file.originalname,
      contentType: file.mimetype,
      buffer: file.buffer,
    });

    const result = await this.updateOrganizationMemberUseCase.execute({
      organizationId: request.user.organizationId,
      actorUserId: request.user.userId,
      actorRoles: request.user.roles,
      actorIsPlatformAdmin: request.user.isPlatformAdmin,
      userId,
      avatarUrl,
    });

    if (result.isFail()) {
      throw new BadRequestException(result.unwrapError().message);
    }

    return ok(result.unwrap());
  }

  @Post('current/users/:userId/clone')
  @RequirePermissions(permissions.organization.membersClone)
  @ApiOkResponse({ description: 'Clona perfil basico e papel do colaborador.' })
  async cloneMember(
    @Param('userId') userId: string,
    @Body() body: CloneOrganizationMemberDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<User>> {
    const result = await this.cloneOrganizationMemberUseCase.execute({
      organizationId: request.user.organizationId,
      actorRoles: request.user.roles,
      actorIsPlatformAdmin: request.user.isPlatformAdmin,
      sourceUserId: userId,
      fullName: body.fullName,
      email: body.email,
      password: body.password,
    });

    if (result.isFail()) {
      throw new BadRequestException(result.unwrapError().message);
    }

    return ok(result.unwrap());
  }

  private assertImage(
    file: UploadedImageFile | undefined,
  ): asserts file is UploadedImageFile {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed.');
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Image must have at most 2MB.');
    }
  }
}
