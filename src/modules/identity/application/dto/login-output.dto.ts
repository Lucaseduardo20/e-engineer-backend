export interface LoginOutputDto {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    organizationId: string;
  };
}
