import { IsUUID } from 'class-validator';

export class SwitchTenantRequestDto {
  @IsUUID()
  organizationId!: string;
}
