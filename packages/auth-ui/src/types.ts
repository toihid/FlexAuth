import { AuthSession, BrandingConfig } from '@flexauth/shared-types';

export interface AuthUIConfig {
  /** Backend API base URL */
  apiBaseUrl: string;
  /** Callback on successful authentication */
  onSuccess?: (session: AuthSession) => void;
  /** Callback on authentication error */
  onError?: (error: Error) => void;
  /** Custom branding overrides */
  branding?: Partial<BrandingConfig>;
  /** Show registration link */
  showRegister?: boolean;
  /** Show forgot password link */
  showForgotPassword?: boolean;
  /** Custom redirect after login */
  redirectUrl?: string;
}

export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: import('@flexauth/shared-types').AuthUser | null;
  error: string | null;
}
