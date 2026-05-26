export class LoginResponseDto {
  token!: string;
  user!: {
    id: string;
    email: string;
    name: string;
    organizationId: string;
  };
}
