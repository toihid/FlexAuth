'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Container } from '@mui/material';

/**
 * Root page — checks auth status and redirects accordingly:
 * - Not logged in → /login
 * - Admin role → /admin
 * - Regular user → /dashboard
 */
export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

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
          const roles: string[] = data.data.roles || [];
          if (roles.includes('admin')) {
            router.replace('/admin');
          } else {
            router.replace('/dashboard');
          }
        } else {
          sessionStorage.removeItem('auth_access_token');
          sessionStorage.removeItem('auth_refresh_token');
          router.replace('/login');
        }
      })
      .catch(() => {
        router.replace('/login');
      })
      .finally(() => setChecking(false));
  }, [router]);

  return (
    <Container maxWidth="sm">
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    </Container>
  );
}
