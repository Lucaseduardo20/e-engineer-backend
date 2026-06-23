export interface LoginOutputDto {
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
