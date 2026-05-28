import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  tenantRoles,
  type TenantRole,
} from '../../../../shared/application/authorization/role-permissions';

export class UpdateOrganizationMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsIn(tenantRoles)
  role?: TenantRole;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string | null;
}
