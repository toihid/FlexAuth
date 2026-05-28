/**
 * Core authentication types shared between frontend and backend.
 */

export type LoginIdentifierType = 'email' | 'username' | 'mobile';

export interface LoginCredentials {
  identifier: string;
  identifierType: LoginIdentifierType;
  password: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
  mobile?: string;
  displayName: string;
  avatar?: string;
  providers: string[];
  roles: string[];
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface MfaChallenge {
  challengeId: string;
  method: 'totp' | 'sms' | 'email';
  expiresAt: string;
}

export interface MfaVerification {
  challengeId: string;
  code: string;
}
