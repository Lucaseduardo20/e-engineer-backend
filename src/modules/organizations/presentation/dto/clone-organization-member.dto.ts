import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CloneOrganizationMemberDto {
  @IsString()
  @MaxLength(160)
  fullName!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
