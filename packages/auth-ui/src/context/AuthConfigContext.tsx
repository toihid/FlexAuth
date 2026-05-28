import React, { createContext, useContext, useMemo } from 'react';
import { AuthProviderConfig, BrandingConfig } from '@flexauth/shared-types';
import { useProviders } from '../hooks/useProviders';
import { AuthUIConfig } from '../types';

interface AuthConfigContextValue {
  providers: AuthProviderConfig[];
  branding: BrandingConfig;
  isLoading: boolean;
  error: string | null;
  config: AuthUIConfig;
}

const AuthConfigContext = createContext<AuthConfigContextValue | null>(null);

interface AuthConfigProviderProps {
  config: AuthUIConfig;
  children: React.ReactNode;
}

/**
 * Provider that fetches and exposes auth configuration from the backend.
 * Wrap your auth UI components with this provider.
 */
export function AuthConfigProvider({ config, children }: AuthConfigProviderProps) {
  const { providers, branding, isLoading, error } = useProviders(config.apiBaseUrl);

  const mergedBranding = useMemo(
    () => ({
      ...branding,
      ...config.branding,
    }),
    [branding, config.branding]
  );

  const value = useMemo(
    () => ({
      providers,
      branding: mergedBranding,
      isLoading,
      error,
      config,
    }),
    [providers, mergedBranding, isLoading, error, config]
  );

  return (
    <AuthConfigContext.Provider value={value}>
      {children}
    </AuthConfigContext.Provider>
  );
}

export function useAuthConfig(): AuthConfigContextValue {
  const context = useContext(AuthConfigContext);
  if (!context) {
    throw new Error('useAuthConfig must be used within an AuthConfigProvider');
  }
  return context;
}
