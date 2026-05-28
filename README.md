# FlexAuth

A production-grade, modular authentication system built as a monorepo with:
- **Reusable React UI library** (npm package)
- **Backend auth service** (Express + MongoDB)
- **Next.js demo application**
- **Admin-controlled provider system**

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MONOREPO (pnpm + Turborepo)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  packages/       │  │  packages/        │  │  apps/           │  │
│  │  auth-ui         │  │  auth-backend     │  │  demo            │  │
│  │  (npm package)   │  │  (Express API)    │  │  (Next.js)       │  │
│  │                  │  │                   │  │                  │  │
│  │  React + MUI     │  │  MongoDB          │  │  Uses auth-ui    │  │
│  │  Components      │  │  JWT + bcrypt     │  │  Login page      │  │
│  │  Hooks           │  │  OAuth            │  │  Dashboard       │  │
│  │  Context         │  │  BankID           │  │  Admin panel     │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                      │                      │           │
│           └──────────────────────┼──────────────────────┘           │
│                                  │                                   │
│  ┌───────────────────────────────┴───────────────────────────────┐  │
│  │                  packages/shared-types                         │  │
│  │                  (TypeScript interfaces)                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌──────────────┐         ┌──────────────────┐         ┌──────────────┐
│   Frontend   │────────▶│   Auth Backend   │────────▶│   MongoDB    │
│  (auth-ui)   │  HTTPS  │   (Express)      │         │              │
│              │◀────────│                  │◀────────│              │
└──────────────┘         └────────┬─────────┘         └──────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
              ┌─────▼────┐ ┌─────▼────┐ ┌─────▼────┐
              │  Google   │ │  GitHub  │ │  BankID  │
              │  OAuth    │ │  OAuth   │ │  API     │
              └──────────┘ └──────────┘ └──────────┘

Key Security Principles:
• Admin config is SERVER-AUTHORITATIVE (frontend only renders)
• OAuth token verification is BACKEND-ONLY
• BankID communication is SERVER-SIDE ONLY
• Passwords hashed with bcrypt (cost factor 12)
• JWT with short-lived access + rotating refresh tokens
• Rate limiting on all endpoints
• Input validation via Zod schemas
• No sensitive data in error responses
```

## Data Flow: Admin-Controlled Providers

```
1. Admin enables/disables providers via /admin/config
2. Frontend calls GET /auth/config on load
3. Backend returns ONLY enabled providers (secrets stripped)
4. Frontend renders available login options dynamically
5. User attempts login → backend verifies provider is still enabled
6. If provider disabled between render and submit → request rejected
```

## Quick Start

### Prerequisites
- Node.js >= 20
- pnpm >= 9
- MongoDB (local or Atlas)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment files
cp packages/auth-backend/.env.example packages/auth-backend/.env
cp apps/demo/.env.local.example apps/demo/.env.local

# Edit .env with your MongoDB URI and secrets

# Build all packages
pnpm build

# Start development
pnpm dev
```

### Running Individual Packages

```bash
# Backend only
pnpm --filter @flexauth/auth-backend dev

# Demo app only
pnpm --filter @flexauth/demo dev

# Build UI library
pnpm --filter @flexauth/auth-ui build
```

## Project Structure

```
flexauth/
├── apps/
│   └── demo/                    # Next.js demo application
│       └── src/app/
│           ├── login/           # Login page using auth-ui
│           ├── register/        # Registration page
│           ├── dashboard/       # Protected dashboard
│           └── admin/           # Admin config panel
├── packages/
│   ├── auth-ui/                 # React UI library (npm package)
│   │   └── src/
│   │       ├── components/      # MUI components
│   │       ├── context/         # Auth state management
│   │       └── hooks/           # API hooks
│   ├── auth-backend/            # Express auth service
│   │   └── src/
│   │       ├── config/          # DB, logger, env
│   │       ├── middleware/      # Auth, error handling
│   │       ├── models/          # Mongoose schemas
│   │       ├── routes/          # API routes
│   │       ├── services/        # Business logic
│   │       ├── validation/      # Zod schemas
│   │       └── seeds/           # Default config
│   └── shared-types/            # Shared TypeScript types
├── turbo.json                   # Turborepo config
├── pnpm-workspace.yaml          # Workspace definition
└── tsconfig.base.json           # Shared TS config
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /auth/config | Get enabled providers + branding | Public |
| POST | /auth/login | Local login | Public |
| POST | /auth/register | Register new user | Public |
| POST | /auth/refresh | Refresh access token | Public |
| POST | /auth/logout | Revoke tokens | Bearer |
| GET | /auth/me | Get current user | Bearer |
| POST | /auth/verify-mfa | Verify MFA code | Public |
| GET | /auth/oauth/:provider | Initiate OAuth flow | Public |
| POST | /auth/bankid/init | Start BankID auth | Public |
| POST | /auth/bankid/collect | Poll BankID status | Public |
| GET | /admin/config | Get full admin config | Admin |
| PUT | /admin/config | Update admin config | Admin |

## NPM Package Usage

```tsx
import {
  AuthLogin,
  AuthProvider,
  AuthConfigProvider,
} from '@flexauth/auth-ui';

function App() {
  const config = {
    apiBaseUrl: 'https://your-auth-api.com',
    onSuccess: (session) => console.log('Logged in!', session),
    branding: { appName: 'My App' },
  };

  return (
    <AuthConfigProvider config={config}>
      <AuthProvider config={config}>
        <AuthLogin />
      </AuthProvider>
    </AuthConfigProvider>
  );
}
```

## MongoDB Schema Design

### Users Collection
- Indexed on: `email` (unique, sparse), `username` (unique, sparse), `mobile` (unique, sparse)
- Compound index on: `providers.provider` + `providers.providerId`
- Password stored as bcrypt hash (cost 12)
- Provider links stored as embedded array

### AdminConfig Collection
- Single document pattern (latest by updatedAt)
- Stores provider configs, security rules, branding
- Secrets field never exposed to frontend API

### RefreshTokens Collection
- TTL index on `expiresAt` for automatic cleanup
- Token rotation with reuse detection

## License

MIT
