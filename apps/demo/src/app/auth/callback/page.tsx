'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, Container } from '@mui/material';

/**
 * OAuth callback page.
 * Receives tokens from the URL fragment after OAuth redirect.
 * Redirects based on user role.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      sessionStorage.setItem('auth_access_token', accessToken);
      sessionStorage.setItem('auth_refresh_token', refreshToken);

      // Fetch user to determine role-based redirect
      const apiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:4000';
      fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data.roles.includes('admin')) {
            router.replace('/admin');
          } else {
            router.replace('/dashboard');
          }
        })
        .catch(() => {
          router.replace('/dashboard');
        });
    } else {
      router.replace('/login?error=oauth_failed');
    }
  }, [router]);

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Completing sign in...
        </Typography>
      </Box>
    </Container>
  );
}
