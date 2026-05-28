'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';

interface ProviderEntry {
  type: string;
  enabled: boolean;
  displayName: string;
  priority: number;
  supportedIdentifiers: string[];
  settings: Record<string, unknown>;
}

interface AdminConfigData {
  providers: ProviderEntry[];
  security: {
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSymbols: boolean;
    sessionTimeoutMinutes: number;
    mfaEnabled: boolean;
  };
  branding: {
    appName: string;
    logoUrl?: string;
    primaryColor?: string;
    accentColor?: string;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [config, setConfig] = useState<AdminConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:4000';

  useEffect(() => {
    // Verify user is admin before loading config
    const token = sessionStorage.getItem('auth_access_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    fetch(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.roles.includes('admin')) {
          fetchConfig();
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => {
        router.replace('/login');
      });
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('auth_access_token');
      const res = await fetch(`${apiUrl}/admin/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      } else {
        setError(data.error?.message || 'Failed to load config');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderToggle = (index: number) => {
    if (!config) return;
    const updated = { ...config };
    updated.providers[index].enabled = !updated.providers[index].enabled;
    setConfig(updated);
  };

  const handleSave = async () => {
    if (!config) return;
    setError(null);
    setSuccess(null);

    try {
      const token = sessionStorage.getItem('auth_access_token');
      const res = await fetch(`${apiUrl}/admin/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Configuration saved successfully');
      } else {
        setError(data.error?.message || 'Failed to save config');
      }
    } catch {
      setError('Failed to save configuration');
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
            Admin Configuration
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="outlined" size="small" color="error" onClick={() => {
              sessionStorage.removeItem('auth_access_token');
              sessionStorage.removeItem('auth_refresh_token');
              router.replace('/login');
            }}>
              Logout
            </Button>
          </Stack>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Control which authentication providers are enabled and configure security settings.
          Changes here affect what login options users see.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

        {config && (
          <Stack spacing={3}>
            {/* Providers */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Authentication Providers
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Enable or disable authentication methods. Only enabled providers will be shown to users.
              </Typography>

              <Stack spacing={2}>
                {config.providers.map((provider, index) => (
                  <Box
                    key={provider.type}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    p={2}
                    border={1}
                    borderColor="divider"
                    borderRadius={1}
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {provider.displayName}
                      </Typography>
                      <Stack direction="row" spacing={0.5} mt={0.5}>
                        {provider.supportedIdentifiers.map((id) => (
                          <Chip key={id} label={id} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={provider.enabled}
                          onChange={() => handleProviderToggle(index)}
                        />
                      }
                      label={provider.enabled ? 'Enabled' : 'Disabled'}
                    />
                  </Box>
                ))}
              </Stack>
            </Paper>

            {/* Security */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Security Settings
              </Typography>

              <Stack spacing={2}>
                <TextField
                  label="Max Login Attempts"
                  type="number"
                  value={config.security.maxLoginAttempts}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      security: { ...config.security, maxLoginAttempts: parseInt(e.target.value) || 5 },
                    })
                  }
                  size="small"
                />
                <TextField
                  label="Lockout Duration (minutes)"
                  type="number"
                  value={config.security.lockoutDurationMinutes}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      security: { ...config.security, lockoutDurationMinutes: parseInt(e.target.value) || 30 },
                    })
                  }
                  size="small"
                />
                <TextField
                  label="Minimum Password Length"
                  type="number"
                  value={config.security.passwordMinLength}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      security: { ...config.security, passwordMinLength: parseInt(e.target.value) || 8 },
                    })
                  }
                  size="small"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.security.passwordRequireUppercase}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          security: { ...config.security, passwordRequireUppercase: e.target.checked },
                        })
                      }
                    />
                  }
                  label="Require uppercase letters"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.security.passwordRequireNumbers}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          security: { ...config.security, passwordRequireNumbers: e.target.checked },
                        })
                      }
                    />
                  }
                  label="Require numbers"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.security.passwordRequireSymbols}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          security: { ...config.security, passwordRequireSymbols: e.target.checked },
                        })
                      }
                    />
                  }
                  label="Require special characters"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.security.mfaEnabled}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          security: { ...config.security, mfaEnabled: e.target.checked },
                        })
                      }
                    />
                  }
                  label="Enable MFA"
                />
              </Stack>
            </Paper>

            {/* Branding */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Branding
              </Typography>

              <Stack spacing={2}>
                <TextField
                  label="Application Name"
                  value={config.branding.appName}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      branding: { ...config.branding, appName: e.target.value },
                    })
                  }
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Logo URL"
                  value={config.branding.logoUrl || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      branding: { ...config.branding, logoUrl: e.target.value },
                    })
                  }
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Primary Color"
                  value={config.branding.primaryColor || '#1976d2'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      branding: { ...config.branding, primaryColor: e.target.value },
                    })
                  }
                  size="small"
                />
              </Stack>
            </Paper>

            <Button variant="contained" size="large" onClick={handleSave}>
              Save Configuration
            </Button>
          </Stack>
        )}
      </Box>
    </Container>
  );
}
