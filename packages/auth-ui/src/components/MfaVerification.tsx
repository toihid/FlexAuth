import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { AuthContainer } from './AuthContainer';

interface MfaVerificationProps {
  challengeId: string;
  method: 'totp' | 'sms' | 'email';
  onVerify: (code: string) => Promise<void>;
  onCancel?: () => void;
}

/**
 * MFA verification component.
 * Shown when the backend requires a second factor.
 */
export function MfaVerification({
  challengeId,
  method,
  onVerify,
  onCancel,
}: MfaVerificationProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      await onVerify(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodLabel = (): string => {
    switch (method) {
      case 'totp': return 'authenticator app';
      case 'sms': return 'SMS';
      case 'email': return 'email';
      default: return 'device';
    }
  };

  return (
    <AuthContainer title="Two-Factor Authentication">
      <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
        Enter the 6-digit code from your {getMethodLabel()}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          fullWidth
          label="Verification Code"
          value={code}
          onChange={(e) => {
            // Only allow digits, max 6
            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
            setCode(val);
          }}
          margin="normal"
          required
          autoFocus
          autoComplete="one-time-code"
          inputProps={{
            'aria-label': 'Verification code',
            inputMode: 'numeric',
            pattern: '[0-9]*',
            maxLength: 6,
          }}
          placeholder="000000"
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading || code.length !== 6}
          sx={{ mt: 2 }}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Verify'}
        </Button>

        {onCancel && (
          <Button
            fullWidth
            variant="text"
            onClick={onCancel}
            sx={{ mt: 1 }}
          >
            Cancel
          </Button>
        )}
      </Box>
    </AuthContainer>
  );
}
