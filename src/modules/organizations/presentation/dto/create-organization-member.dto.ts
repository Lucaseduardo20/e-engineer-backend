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

export class CreateOrganizationMemberDto {
  @IsString()
  @MaxLength(160)
  fullName!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(tenantRoles)
  role!: TenantRole;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string | null;
}
