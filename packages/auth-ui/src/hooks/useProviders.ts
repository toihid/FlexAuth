import { useState, useEffect } from 'react';
import { AuthProviderConfig, ProvidersResponse, BrandingConfig } from '@flexauth/shared-types';
import { useAuthApi } from './useAuthApi';

interface UseProvidersResult {
  providers: AuthProviderConfig[];
  branding: BrandingConfig;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch enabled providers from the backend.
 * The backend is the source of truth for which providers are available.
 */
export function useProviders(apiBaseUrl: string): UseProvidersResult {
  const [providers, setProviders] = useState<AuthProviderConfig[]>([]);
  const [branding, setBranding] = useState<BrandingConfig>({ appName: 'Auth System' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useAuthApi(apiBaseUrl);

  const fetchConfig = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const config: ProvidersResponse = await api.getConfig();
      setProviders(config.providers);
      setBranding(config.branding);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load authentication config');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [apiBaseUrl]);

  return { providers, branding, isLoading, error, refetch: fetchConfig };
}
