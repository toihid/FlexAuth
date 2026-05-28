import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuthApi } from '../hooks/useAuthApi';
import { useAuthConfig } from '../context/AuthConfigContext';

/**
 * BankID login component.
 * Initiates BankID auth via backend — all communication with BankID is server-side.
 * Frontend only polls our backend for status updates.
 */
export function BankIdLogin() {
  const { config } = useAuthConfig();
  const api = useAuthApi(config.apiBaseUrl);
  const [status, setStatus] = useState<'idle' | 'pending' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const handleBankIdLogin = async () => {
    setStatus('pending');
    setError(null);

    try {
      const result = await api.initBankId();

      // Poll for completion every 2 seconds
      pollRef.current = setInterval(async () => {
        try {
          const response = await fetch(`${config.apiBaseUrl}/auth/bankid/collect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderRef: result.orderRef }),
          });
          const data = await response.json();

          if (data.success && data.data.status === 'complete') {
            cleanup();
            // Store tokens and redirect
            const session = data.data.session;
            sessionStorage.setItem('auth_access_token', session.tokens.accessToken);
            sessionStorage.setItem('auth_refresh_token', session.tokens.refreshToken);

            // Call onSuccess if configured
            config.onSuccess?.(session);

            // Redirect based on role
            if (session.user.roles.includes('admin')) {
              window.location.href = '/admin';
            } else {
              window.location.href = '/dashboard';
            }
          } else if (data.success && data.data.status === 'failed') {
            cleanup();
            setStatus('error');
            setError('BankID authentication failed. Please try again.');
          }
          // If pending, keep polling
        } catch {
          cleanup();
          setStatus('error');
          setError('Connection error. Please try again.');
        }
      }, 2000);

      // Timeout after 60 seconds
      setTimeout(() => {
        if (pollRef.current) {
          cleanup();
          setStatus('error');
          setError('BankID authentication timed out. Please try again.');
        }
      }, 60000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'BankID authentication failed');
    }
  };

  const handleCancel = () => {
    cleanup();
    setStatus('idle');
    setError(null);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {status === 'pending' ? (
        <Box textAlign="center" py={2}>
          <CircularProgress size={32} sx={{ mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Waiting for BankID...
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Open the BankID app on your device
          </Typography>
          <Box mt={1}>
            <Button size="small" onClick={handleCancel} color="inherit">
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <Button
          fullWidth
          variant="outlined"
          onClick={handleBankIdLogin}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            py: 1.2,
            borderColor: '#235971',
            color: '#235971',
            '&:hover': {
              borderColor: '#235971',
              backgroundColor: '#23597110',
            },
          }}
          aria-label="Sign in with BankID"
        >
          Sign in with BankID
        </Button>
      )}
    </Box>
  );
}
