'use client';

import { useRouter } from 'next/navigation';
import {
  AuthRegister,
  AuthProvider,
  AuthConfigProvider,
  AuthUIConfig,
} from '@flexauth/auth-ui';

const authConfig: AuthUIConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:4000',
  showRegister: true,
  onSuccess: (session) => {
    console.log('Registration successful:', session.user.displayName);
  },
};

export default function RegisterPage() {
  const router = useRouter();

  return (
    <AuthConfigProvider config={authConfig}>
      <AuthProvider config={authConfig}>
        <AuthRegister onLoginClick={() => router.push('/login')} />
      </AuthProvider>
    </AuthConfigProvider>
  );
}
