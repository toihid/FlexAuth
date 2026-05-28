'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AuthLogin,
  AuthProvider,
  AuthConfigProvider,
  AuthUIConfig,
  AuthSession,
} from '@flexauth/auth-ui';

export default function LoginPage() {
  const router = useRouter();

  // If already logged in, redirect based on role
  useEffect(() => {
    const token = sessionStorage.getItem('auth_access_token');
    if (token) {
      const apiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:4000';
      fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            redirectByRole(data.data.roles);
          }
        })
        .catch(() => {
          // Token invalid, stay on login
          sessionStorage.removeItem('auth_access_token');
        });
    }
  }, []);

  const redirectByRole = (roles: string[]) => {
    if (roles.includes('admin')) {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSuccess = (session: AuthSession) => {
    redirectByRole(session.user.roles);
  };

  const authConfig: AuthUIConfig = {
    apiBaseUrl: process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:4000',
    showRegister: true,
    showForgotPassword: true,
    onSuccess: handleSuccess,
    onError: (error) => {
      console.error('Auth error:', error.message);
    },
  };

  return (
    <AuthConfigProvider config={authConfig}>
      <AuthProvider config={authConfig}>
        <AuthLogin
          onRegisterClick={() => router.push('/register')}
          onForgotPasswordClick={() => alert('Forgot password flow')}
        />
      </AuthProvider>
    </AuthConfigProvider>
  );
}
