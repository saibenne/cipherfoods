export interface JwtPayload {
  sub: string;
  email: string;
  preferred_username: string;
  realm_access: {
    roles: string[];
  };
  resource_access?: Record<string, { roles: string[] }>;
  given_name?: string;
  family_name?: string;
  email_verified: boolean;
  iat: number;
  exp: number;
  iss: string;
  aud: string | string[];
}
