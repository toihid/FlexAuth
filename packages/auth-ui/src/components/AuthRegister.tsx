import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  Typography,
  Link,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useAuthConfig } from '../context/AuthConfigContext';
import { AuthContainer } from './AuthContainer';

interface AuthRegisterProps {
  onLoginClick?: () => void;
}

/**
 * Registration form component.
 * Fields are dynamically shown based on admin-enabled identifiers.
 */
export function AuthRegister({ onLoginClick }: AuthRegisterProps) {
  const { register, isLoading, error, clearError } = useAuth();
  const { providers } = useAuthConfig();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const localProvider = providers.find((p) => p.type === 'local');
  const supportedIdentifiers = localProvider?.supportedIdentifiers || ['email'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    // Client-side validation
    if (!displayName.trim()) {
      setValidationError('Display name is required');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    const hasIdentifier = email || username || mobile;
    if (!hasIdentifier) {
      setValidationError('At least one identifier (email, username, or mobile) is required');
      return;
    }

    await register({
      email: email || undefined,
      username: username || undefined,
      mobile: mobile || undefined,
      displayName: displayName.trim(),
      password,
    });
  };

  return (
    <AuthContainer title="Create Account" subtitle="Get started with your account">
      {(error || validationError) && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => {
            clearError();
            setValidationError(null);
          }}
        >
          {validationError || error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          fullWidth
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          margin="normal"
          required
          autoFocus
          inputProps={{ 'aria-label': 'Display name', maxLength: 100 }}
        />

        {supportedIdentifiers.includes('email') && (
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            autoComplete="email"
            inputProps={{ 'aria-label': 'Email address', maxLength: 255 }}
          />
        )}

        {supportedIdentifiers.includes('username') && (
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            autoComplete="username"
            helperText="3-30 characters, letters, numbers, hyphens, underscores"
            inputProps={{ 'aria-label': 'Username', maxLength: 30 }}
          />
        )}

        {supportedIdentifiers.includes('mobile') && (
          <TextField
            fullWidth
            label="Mobile Number"
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            margin="normal"
            helperText="International format (e.g., +46701234567)"
            inputProps={{ 'aria-label': 'Mobile number', maxLength: 16 }}
          />
        )}

        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
          autoComplete="new-password"
          helperText="Minimum 8 characters"
          inputProps={{ 'aria-label': 'Password', maxLength: 128 }}
        />

        <TextField
          fullWidth
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          margin="normal"
          required
          autoComplete="new-password"
          inputProps={{ 'aria-label': 'Confirm password', maxLength: 128 }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading}
          sx={{ mt: 3, mb: 1 }}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Create Account'}
        </Button>
      </Box>

      <Box textAlign="center" mt={2}>
        <Typography variant="body2" color="text.secondary">
          Already have an account?{' '}
          <Link
            component="button"
            variant="body2"
            onClick={onLoginClick}
            underline="hover"
          >
            Sign in
          </Link>
        </Typography>
      </Box>
    </AuthContainer>
  );
}
