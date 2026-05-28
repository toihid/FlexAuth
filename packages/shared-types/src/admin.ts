/**
 * Admin configuration types.
 * Admin controls which providers are enabled and their settings.
 */

import { BrandingConfig } from './providers';

export interface AdminAuthConfig {
  id: string;
  /** Which providers are enabled */
  providers: AdminProviderEntry[];
  /** Security settings */
  security: SecurityConfig;
  /** Branding settings */
  branding: BrandingConfig;
  updatedAt: string;
  updatedBy: string;
}

export interface AdminProviderEntry {
  type: string;
  enabled: boolean;
  displayName: string;
  priority: number;
  supportedIdentifiers: string[];
  /** Sensitive config (never sent to frontend) */
  secrets?: Record<string, string>;
  /** Non-sensitive config */
  settings: Record<string, unknown>;
}

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  sessionTimeoutMinutes: number;
  mfaEnabled: boolean;
  mfaMethods: ('totp' | 'sms' | 'email')[];
}
