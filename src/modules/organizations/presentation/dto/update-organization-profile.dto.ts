import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateOrganizationProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  legalName?: string | null;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  logoUrl?: string | null;
}
