'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@flexauth/shared-types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('auth_access_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:4000';
    fetch(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.data);
        } else {
          sessionStorage.removeItem('auth_access_token');
          sessionStorage.removeItem('auth_refresh_token');
          router.replace('/login');
        }
      })
      .catch(() => {
        setError('Failed to load user data');
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  const handleLogout = () => {
    const token = sessionStorage.getItem('auth_access_token');
    const apiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:4000';

    if (token) {
      fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    sessionStorage.removeItem('auth_access_token');
    sessionStorage.removeItem('auth_refresh_token');
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  const isAdmin = user?.roles.includes('admin');

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Paper sx={{ p: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" fontWeight={600}>
              Dashboard
            </Typography>
            <Stack direction="row" spacing={1}>
              {isAdmin && (
                <Button variant="outlined" color="secondary" onClick={() => router.push('/admin')}>
                  Admin Panel
                </Button>
              )}
              <Button variant="outlined" color="error" onClick={handleLogout}>
                Logout
              </Button>
            </Stack>
          </Box>

          {user && (
            <Box>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar
                  src={user.avatar}
                  alt={user.displayName}
                  sx={{ width: 64, height: 64 }}
                >
                  {user.displayName.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{user.displayName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email || user.username || user.mobile}
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Roles
                  </Typography>
                  <Stack direction="row" spacing={1} mt={0.5}>
                    {user.roles.map((role) => (
                      <Chip key={role} label={role} size="small" color={role === 'admin' ? 'secondary' : 'default'} />
                    ))}
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Connected Providers
                  </Typography>
                  <Stack direction="row" spacing={1} mt={0.5}>
                    {user.providers.map((provider) => (
                      <Chip key={provider} label={provider} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    MFA Status
                  </Typography>
                  <Chip
                    label={user.mfaEnabled ? 'Enabled' : 'Disabled'}
                    color={user.mfaEnabled ? 'success' : 'default'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Stack>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
