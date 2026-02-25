import { Injectable } from '@nestjs/common';

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string;
  provider: 'microsoft';
  roles: string[];
}

@Injectable()
export class AuthService {
  buildUserFromMicrosoftProfile(profile: {
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
  }): AuthUser {
    const id = profile.oid ?? profile.sub ?? '';
    const email =
      profile.preferred_username ??
      profile.upn ??
      profile._json?.preferred_username ??
      profile._json?.email ??
      null;

    const displayName =
      (profile.displayName ??
        profile._json?.name ??
        [profile.name?.givenName, profile.name?.familyName]
          .filter(Boolean)
          .join(' ')) ||
      email ||
      'Microsoft User';

    return {
      id,
      email,
      displayName,
      provider: 'microsoft',
      roles: [],
    };
  }
}
