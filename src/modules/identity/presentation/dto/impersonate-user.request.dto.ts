import { IsUUID } from 'class-validator';

export class ImpersonateUserRequestDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  organizationId!: string;
}
