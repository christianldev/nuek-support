import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { OIDCStrategy } from 'passport-azure-ad';
import { AuthService } from '../auth.service';

@Injectable()
export class AzureAdStrategy extends PassportStrategy(
  OIDCStrategy,
  'azuread-openidconnect',
) {
  private readonly logger = new Logger(AzureAdStrategy.name);
  private readonly isConfigured: boolean;

  constructor(private readonly authService: AuthService) {
    const tenantId = process.env.AZURE_AD_TENANT_ID;
    const clientId = process.env.AZURE_AD_CLIENT_ID;
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
    const callbackUrl = process.env.AZURE_AD_CALLBACK_URL;
    const hasRequiredConfig =
      Boolean(tenantId) &&
      Boolean(clientId) &&
      Boolean(clientSecret) &&
      Boolean(callbackUrl);

    super({
      identityMetadata: `https://login.microsoftonline.com/${tenantId ?? 'common'}/v2.0/.well-known/openid-configuration`,
      clientID: clientId ?? 'missing-client-id',
      clientSecret: clientSecret ?? 'missing-client-secret',
      responseType: 'code',
      responseMode: 'query',
      redirectUrl:
        callbackUrl ?? 'http://localhost:3000/auth/microsoft/callback',
      allowHttpForRedirectUrl: process.env.NODE_ENV !== 'production',
      scope: ['openid', 'profile', 'email', 'offline_access', 'User.Read'],
      validateIssuer: hasRequiredConfig,
      issuer: hasRequiredConfig
        ? `https://login.microsoftonline.com/${tenantId}/v2.0`
        : undefined,
      passReqToCallback: false,
    });

    this.isConfigured = hasRequiredConfig;

    if (!hasRequiredConfig) {
      this.logger.warn(
        'Microsoft auth is disabled. Create manager-api/.env from manager-api/.env.example and set AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_CALLBACK_URL.',
      );
    }
  }

  validate(
    _issuer: string,
    _sub: string,
    profile: {
      oid?: string;
      sub?: string;
      preferred_username?: string;
      upn?: string;
      displayName?: string;
      name?: {
        givenName?: string;
        familyName?: string;
      };
      _json?: {
        preferred_username?: string;
        email?: string;
        name?: string;
      };
    },
  ) {
    if (!this.isConfigured) {
      throw new UnauthorizedException(
        'Microsoft auth is not configured. Set Azure AD env vars in manager-api/.env.',
      );
    }

    if (!profile) {
      throw new UnauthorizedException('Microsoft profile not found');
    }

    return this.authService.buildUserFromMicrosoftProfile(profile);
  }
}
