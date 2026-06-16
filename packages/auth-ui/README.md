# flexauth-ui

A reusable React authentication UI library with Material UI components. Provides drop-in login, registration, OAuth, and BankID components that connect to the FlexAuth backend.

## Installation

```bash
npm install flexauth-ui @mui/material @emotion/react @emotion/styled @mui/icons-material
```

## Prerequisites

You need the FlexAuth backend running. Clone and deploy it:

```bash
git clone https://github.com/toihid/FlexAuth.git
cd FlexAuth/packages/auth-backend
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
pnpm install
pnpm dev
```

Backend will run at `http://localhost:4000`.

## Quick Start

```tsx
import { AuthLogin, AuthProvider, AuthConfigProvider } from 'flexauth-ui';

const config = {
  apiBaseUrl: 'http://localhost:4000', // Your FlexAuth backend URL
};

function LoginPage() {
  return (
    <AuthConfigProvider config={config}>
      <AuthProvider config={config}>
        <AuthLogin />
      </AuthProvider>
    </AuthConfigProvider>
  );
}
```

That's it — full login page with email/password, OAuth buttons, and BankID support.

## Components

### `<AuthLogin />`

Complete login form with dynamic provider rendering based on backend config.

```tsx
<AuthLogin
  onRegisterClick={() => router.push('/register')}
  onForgotPasswordClick={() => console.log('forgot password')}
/>
```

### `<AuthRegister />`

Registration form with dynamic fields based on enabled identifiers.

```tsx
<AuthRegister
  onLoginClick={() => router.push('/login')}
/>
```

### `<MfaVerification />`

Two-factor authentication code input.

```tsx
<MfaVerification
  challengeId="..."
  method="totp"
  onVerify={async (code) => { /* verify code */ }}
  onCancel={() => { /* go back */ }}
/>
```

## Context Providers

### `<AuthConfigProvider>`

Fetches enabled providers and branding from the backend. Wrap your auth pages with this.

```tsx
<AuthConfigProvider config={{ apiBaseUrl: 'https://your-backend.com' }}>
  {children}
</AuthConfigProvider>
```

### `<AuthProvider>`

Manages authentication state (user, tokens, login/logout actions).

```tsx
<AuthProvider config={{ apiBaseUrl: 'https://your-backend.com' }}>
  {children}
</AuthProvider>
```

## Hooks

### `useAuth()`

Access authentication state and actions anywhere in your app.

```tsx
import { useAuth } from 'flexauth-ui';

function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  if (isLoading) return <p>Loading...</p>;
  if (!isAuthenticated) return <p>Not logged in</p>;

  return (
    <div>
      <p>Welcome, {user.displayName}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### `useAuthConfig()`

Access provider config and branding.

```tsx
import { useAuthConfig } from 'flexauth-ui';

function MyComponent() {
  const { providers, branding } = useAuthConfig();
  // providers = [{type: 'local', ...}, {type: 'google', ...}]
  // branding = {appName: 'My App', primaryColor: '#1976d2'}
}
```

## Configuration

```tsx
const config = {
  apiBaseUrl: 'http://localhost:4000',  // Required: FlexAuth backend URL
  onSuccess: (session) => {             // Optional: called after successful login
    console.log('Logged in:', session.user.displayName);
    window.location.href = '/dashboard';
  },
  onError: (error) => {                 // Optional: called on auth error
    console.error(error.message);
  },
  showRegister: true,                   // Optional: show "Sign up" link
  showForgotPassword: true,             // Optional: show "Forgot password" link
  branding: {                           // Optional: override branding from backend
    appName: 'My App',
    primaryColor: '#1976d2',
  },
};
```

## Features

- **Dynamic provider rendering** — Only shows login methods enabled by admin
- **Email / Username / Mobile login** — Toggle identifier types via admin panel
- **Google OAuth** — One-click Google login (requires backend credentials)
- **BankID** — Swedish BankID authentication (server-side)
- **MFA support** — Two-factor authentication
- **Responsive design** — Works on mobile and desktop
- **Admin-controlled** — No code changes needed to enable/disable providers
- **Secure by default** — All sensitive operations are server-side

## Admin Panel

The FlexAuth backend includes an admin panel where you can:
- Enable/disable authentication providers
- Set password requirements
- Configure account lockout rules
- Customize branding (app name, colors, logo)

## Peer Dependencies

- `react` >= 18
- `@mui/material` >= 5
- `@emotion/react` >= 11
- `@emotion/styled` >= 11

## License

MIT

## Links

- **GitHub:** https://github.com/toihid/FlexAuth
- **npm:** https://www.npmjs.com/package/flexauth-ui
