import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateProjectRequestDto {
  @IsUUID()
  organizationId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  projectType!: string;
}
