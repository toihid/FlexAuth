// Components
export { AuthLogin } from './components/AuthLogin';
export { AuthRegister } from './components/AuthRegister';
export { AuthContainer } from './components/AuthContainer';
export { OAuthButtons } from './components/OAuthButtons';
export { BankIdLogin } from './components/BankIdLogin';
export { MfaVerification } from './components/MfaVerification';

// Provider & Context
export { AuthProvider, useAuth } from './context/AuthContext';
export { AuthConfigProvider, useAuthConfig } from './context/AuthConfigContext';

// Hooks
export { useAuthApi } from './hooks/useAuthApi';
export { useProviders } from './hooks/useProviders';

// Types (re-export from shared)
export type {
  AuthProviderConfig,
  ProvidersResponse,
  BrandingConfig,
  LoginCredentials,
  AuthUser,
  AuthSession,
  AuthTokens,
} from '@flexauth/shared-types';

// UI Config types
export type { AuthUIConfig } from './types';
