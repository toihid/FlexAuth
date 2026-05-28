import React from 'react';
import { Button, Stack } from '@mui/material';
import { AuthProviderConfig } from '@flexauth/shared-types';
import { useAuthConfig } from '../context/AuthConfigContext';

interface OAuthButtonsProps {
  providers: AuthProviderConfig[];
}

/**
 * Renders OAuth provider buttons based on admin-enabled providers.
 * Clicking a button redirects to the backend OAuth initiation endpoint.
 */
export function OAuthButtons({ providers }: OAuthButtonsProps) {
  const { config } = useAuthConfig();

  const handleOAuthClick = (providerType: string) => {
    // Redirect to backend OAuth endpoint
    // The backend handles the full OAuth flow server-side
    window.location.href = `${config.apiBaseUrl}/auth/oauth/${providerType}`;
  };

  const getProviderColor = (type: string): string => {
    switch (type) {
      case 'google': return '#4285F4';
      case 'github': return '#24292e';
      case 'microsoft': return '#00a4ef';
      default: return '#666';
    }
  };

  const getProviderIcon = (type: string): string => {
    switch (type) {
      case 'google': return 'G';
      case 'github': return 'GH';
      case 'microsoft': return 'MS';
      default: return '?';
    }
  };

  return (
    <Stack spacing={1.5}>
      {providers.map((provider) => (
        <Button
          key={provider.type}
          fullWidth
          variant="outlined"
          onClick={() => handleOAuthClick(provider.type)}
          sx={{
            borderColor: getProviderColor(provider.type),
            color: getProviderColor(provider.type),
            textTransform: 'none',
            fontWeight: 500,
            py: 1.2,
            '&:hover': {
              borderColor: getProviderColor(provider.type),
              backgroundColor: `${getProviderColor(provider.type)}10`,
            },
          }}
          aria-label={`Sign in with ${provider.displayName}`}
        >
          <span style={{ marginRight: 8, fontWeight: 700 }}>
            {getProviderIcon(provider.type)}
          </span>
          Continue with {provider.displayName}
        </Button>
      ))}
    </Stack>
  );
}
