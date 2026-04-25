import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwksUri: string;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly client: jwksClient.JwksClient;

  constructor(private readonly configService: ConfigService) {
    const keycloakBaseUrl = this.configService.getOrThrow<string>('KEYCLOAK_BASE_URL');
    const realm = this.configService.getOrThrow<string>('KEYCLOAK_REALM');

    this.jwksUri = `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/certs`;
    this.issuer = this.configService.getOrThrow<string>('JWT_ISSUER');
    this.audience = this.configService.getOrThrow<string>('JWT_AUDIENCE');

    this.client = jwksClient({
      jwksUri: this.jwksUri,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600000,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    try {
      const decoded = await this.verifyToken(token);
      request.user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: { headers: { authorization?: string } }): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }

  private async verifyToken(token: string): Promise<JwtPayload> {
    const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
      this.client.getSigningKey(header.kid, (err, key) => {
        if (err) {
          callback(err);
          return;
        }
        callback(null, key?.getPublicKey());
      });
    };

    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        {
          issuer: this.issuer,
          algorithms: ['RS256'],
        },
        (err, decoded) => {
          if (err) {
            reject(err);
            return;
          }
          const payload = decoded as JwtPayload & { azp?: string };
          // Validate that the token was issued for our client (azp) or audience contains our client
          const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
          if (!aud.includes(this.audience) && payload.azp !== this.audience) {
            reject(new Error('Token not issued for this client'));
            return;
          }
          resolve(payload);
        },
      );
    });
  }
}
