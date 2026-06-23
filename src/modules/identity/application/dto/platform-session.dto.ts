export interface SwitchTenantInputDto {
  actorUserId: string;
  actorOrganizationId: string;
  actorRoles: string[];
  actorIsPlatformAdmin: boolean;
  organizationId: string;
}

export interface ImpersonateUserInputDto {
  actorUserId: string;
  actorOrganizationId: string;
  actorRoles: string[];
  actorIsPlatformAdmin: boolean;
  userId: string;
  organizationId: string;
}

export interface PlatformSessionOutputDto {
  token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    roles: string[];
    isPlatformAdmin?: boolean;
    impersonatedBy?: string | null;
    organizationId: string;
  };
}
