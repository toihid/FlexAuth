/**
 * Standardized API response types.
 * All backend responses follow this format.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiMeta {
  requestId: string;
  timestamp: string;
}

/** Standard error codes */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  ACCOUNT_DISABLED: 'AUTH_ACCOUNT_DISABLED',
  MFA_REQUIRED: 'AUTH_MFA_REQUIRED',
  MFA_INVALID: 'AUTH_MFA_INVALID',
  PROVIDER_DISABLED: 'AUTH_PROVIDER_DISABLED',
  PROVIDER_ERROR: 'AUTH_PROVIDER_ERROR',
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  VALIDATION_ERROR: 'AUTH_VALIDATION_ERROR',
  RATE_LIMITED: 'AUTH_RATE_LIMITED',
  INTERNAL_ERROR: 'AUTH_INTERNAL_ERROR',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
