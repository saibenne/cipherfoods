import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { KeycloakTokenResponse, AuthResponse } from './interfaces/keycloak-user.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly keycloakBaseUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.keycloakBaseUrl = this.configService.getOrThrow<string>('KEYCLOAK_BASE_URL');
    this.realm = this.configService.getOrThrow<string>('KEYCLOAK_REALM');
    this.clientId = this.configService.getOrThrow<string>('KEYCLOAK_CLIENT_ID');
    this.clientSecret = this.configService.getOrThrow<string>('KEYCLOAK_CLIENT_SECRET');
  }

  private get tokenUrl(): string {
    return `${this.keycloakBaseUrl}/realms/${this.realm}/protocol/openid-connect/token`;
  }

  private get adminUrl(): string {
    return `${this.keycloakBaseUrl}/admin/realms/${this.realm}`;
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Normalize name fields: accept either { name } or { firstName, lastName }
    let firstName = dto.firstName;
    let lastName = dto.lastName;
    if (!firstName && dto.name) {
      const parts = dto.name.trim().split(/\s+/);
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || parts[0];
    }
    if (!firstName) {
      throw new HttpException('Either name or firstName is required', HttpStatus.BAD_REQUEST);
    }

    // Normalize phone field
    const phoneNumber = dto.phoneNumber || dto.phone;

    const adminToken = await this.getAdminToken();

    // 1. Create user in Keycloak
    const createResponse = await fetch(`${this.adminUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        username: dto.email,
        email: dto.email,
        firstName,
        lastName: lastName || '',
        enabled: true,
        emailVerified: false,
        credentials: [
          {
            type: 'password',
            value: dto.password,
            temporary: false,
          },
        ],
        attributes: {
          phoneNumber: phoneNumber ? [phoneNumber] : [],
        },
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json().catch(() => ({}));
      this.logger.error('Keycloak registration failed', error);

      if (createResponse.status === 409) {
        throw new HttpException('User already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException('Registration failed', HttpStatus.BAD_REQUEST);
    }

    // 2. Get userId from Location header
    const locationHeader = createResponse.headers.get('Location');
    const userId = locationHeader?.split('/').pop();

    // 3. Assign role via separate role-mapping call
    const roleName = dto.role || 'customer';
    if (userId) {
      try {
        // Fetch the realm role definition
        const roleResponse = await fetch(`${this.adminUrl}/roles/${encodeURIComponent(roleName)}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        if (roleResponse.ok) {
          const role = await roleResponse.json();

          await fetch(`${this.adminUrl}/users/${encodeURIComponent(userId)}/role-mappings/realm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify([role]),
          });
        } else {
          this.logger.warn(`${roleName} role not found in Keycloak — skipping role assignment`);
        }
      } catch (err) {
        this.logger.warn(`Failed to assign ${roleName} role`, err);
      }
    }

    // 4. Auto-login the new user to get tokens
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      username: dto.email,
      password: dto.password,
      scope: 'openid',
    });

    const loginResponse = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!loginResponse.ok) {
      throw new HttpException('Registration succeeded but auto-login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const tokenData = (await loginResponse.json()) as KeycloakTokenResponse;

    // 5. Return formatted auth response
    return this.buildAuthResponse(tokenData);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      username: dto.email,
      password: dto.password,
      scope: 'openid',
    });

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const tokenData = (await response.json()) as KeycloakTokenResponse;
    return this.buildAuthResponse(tokenData);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: dto.refreshToken,
    });

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }

    const tokenData = (await response.json()) as KeycloakTokenResponse;
    return this.buildAuthResponse(tokenData);
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    const logoutUrl = `${this.keycloakBaseUrl}/realms/${this.realm}/protocol/openid-connect/logout`;

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
    });

    await fetch(logoutUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * Build a unified auth response from Keycloak's token response.
   * Decodes the JWT payload (base64 — no signature verification needed since we just obtained it from Keycloak).
   */
  private buildAuthResponse(tokenData: KeycloakTokenResponse): AuthResponse {
    const user = this.decodeUserFromToken(tokenData.access_token);
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      user,
    };
  }

  private decodeUserFromToken(accessToken: string): AuthResponse['user'] {
    const payloadSegment = accessToken.split('.')[1];
    const payload = JSON.parse(Buffer.from(payloadSegment, 'base64').toString('utf-8'));

    const roles: string[] = payload.realm_access?.roles || [];
    const appRoles = roles.filter((r: string) => ['admin', 'vendor', 'customer'].includes(r));
    const role = appRoles[0] || 'customer';

    const firstName: string = payload.given_name || '';
    const lastName: string = payload.family_name || '';
    const name = [firstName, lastName].filter(Boolean).join(' ') || payload.preferred_username || payload.email;

    return {
      id: payload.sub,
      email: payload.email,
      name,
      role,
    };
  }

  /**
   * Obtain an admin token from the Keycloak master realm using the admin user credentials.
   * This is needed for user management operations (create user, assign roles, etc.).
   */
  private async getAdminToken(): Promise<string> {
    const adminUser = this.configService.getOrThrow<string>('KEYCLOAK_ADMIN_USER');
    const adminPassword = this.configService.getOrThrow<string>('KEYCLOAK_ADMIN_PASSWORD');

    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: adminUser,
      password: adminPassword,
    });

    const response = await fetch(
      `${this.keycloakBaseUrl}/realms/master/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      },
    );

    if (!response.ok) {
      throw new HttpException('Failed to obtain admin token', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const data = (await response.json()) as KeycloakTokenResponse;
    return data.access_token;
  }
}
