import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  Divider,
  Typography,
  Link,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
} from '@mui/material';
import { LoginIdentifierType } from '@flexauth/shared-types';
import { useAuth } from '../context/AuthContext';
import { useAuthConfig } from '../context/AuthConfigContext';
import { AuthContainer } from './AuthContainer';
import { OAuthButtons } from './OAuthButtons';
import { BankIdLogin } from './BankIdLogin';

interface AuthLoginProps {
  onRegisterClick?: () => void;
  onForgotPasswordClick?: () => void;
}

/**
 * Complete login component with dynamic provider rendering.
 * Only shows providers that are enabled by the admin backend.
 */
export function AuthLogin({ onRegisterClick, onForgotPasswordClick }: AuthLoginProps) {
  const { login, isLoading, error, clearError } = useAuth();
  const { providers, config } = useAuthConfig();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierType, setIdentifierType] = useState<LoginIdentifierType>('email');

  // Determine which identifier types are supported by the local provider
  const localProvider = providers.find((p) => p.type === 'local');
  const oauthProviders = providers.filter((p) =>
    ['google', 'github', 'microsoft'].includes(p.type)
  );
  const bankIdProvider = providers.find((p) => p.type === 'bankid');

  const supportedIdentifiers = localProvider?.supportedIdentifiers || ['email'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Basic client-side validation (server validates too)
    if (!identifier.trim() || !password.trim()) return;

    await login(identifier.trim(), identifierType, password);
  };

  const getIdentifierLabel = (): string => {
    switch (identifierType) {
      case 'email': return 'Email address';
      case 'username': return 'Username';
      case 'mobile': return 'Mobile number';
      default: return 'Identifier';
    }
  };

  const getIdentifierType = (): string => {
    switch (identifierType) {
      case 'email': return 'email';
      case 'mobile': return 'tel';
      default: return 'text';
    }
  };

  return (
    <AuthContainer title="Sign In" subtitle="Welcome back">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Local login form */}
      {localProvider && (
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Identifier type selector */}
          {supportedIdentifiers.length > 1 && (
            <ToggleButtonGroup
              value={identifierType}
              exclusive
              onChange={(_e, value) => value && setIdentifierType(value)}
              size="small"
              fullWidth
              sx={{ mb: 2 }}
              aria-label="Login identifier type"
            >
              {supportedIdentifiers.includes('email') && (
                <ToggleButton value="email">Email</ToggleButton>
              )}
              {supportedIdentifiers.includes('username') && (
                <ToggleButton value="username">Username</ToggleButton>
              )}
              {supportedIdentifiers.includes('mobile') && (
                <ToggleButton value="mobile">Mobile</ToggleButton>
              )}
            </ToggleButtonGroup>
          )}

          <TextField
            fullWidth
            label={getIdentifierLabel()}
            type={getIdentifierType()}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            margin="normal"
            required
            autoComplete={identifierType === 'email' ? 'email' : 'username'}
            autoFocus
            inputProps={{
              'aria-label': getIdentifierLabel(),
              maxLength: 255,
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            autoComplete="current-password"
            inputProps={{
              'aria-label': 'Password',
              maxLength: 128,
            }}
          />

          {config.showForgotPassword !== false && (
            <Box textAlign="right" mt={0.5}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={onForgotPasswordClick}
                underline="hover"
              >
                Forgot password?
              </Link>
            </Box>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ mt: 2, mb: 1 }}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </Box>
      )}

      {/* OAuth providers */}
      {oauthProviders.length > 0 && localProvider && (
        <Divider sx={{ my: 2 }}>
          <Typography variant="body2" color="text.secondary">
            or continue with
          </Typography>
        </Divider>
      )}

      {oauthProviders.length > 0 && (
        <OAuthButtons providers={oauthProviders} />
      )}

      {/* BankID */}
      {bankIdProvider && (
        <>
          <Divider sx={{ my: 2 }} />
          <BankIdLogin />
        </>
      )}

      {/* Register link */}
      {config.showRegister !== false && (
        <Box textAlign="center" mt={2}>
          <Typography variant="body2" color="text.secondary">
            Don&apos;t have an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={onRegisterClick}
              underline="hover"
            >
              Sign up
            </Link>
          </Typography>
        </Box>
      )}
    </AuthContainer>
  );
}
