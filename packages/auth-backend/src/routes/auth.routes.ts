import { Router, Request, Response, NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import { authService } from '../services/auth.service';
import { configService } from '../services/config.service';
import { tokenService } from '../services/token.service';
import { bankIdService } from '../services/bankid.service';
import { loginSchema, registerSchema, mfaVerifySchema, refreshTokenSchema } from '../validation/auth.schemas';
import { authenticate } from '../middleware/auth.middleware';
import { ApiResponse } from '@flexauth/shared-types';

export const authRouter: RouterType = Router();

/**
 * GET /auth/config
 * Returns enabled providers and branding (public endpoint).
 * This is what the frontend uses to render available login options.
 */
authRouter.get('/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await configService.getPublicConfig();
    const response: ApiResponse = {
      success: true,
      data: config,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/login
 * Local authentication with email/username/mobile + password.
 */
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const session = await authService.login(
      input,
      req.headers['user-agent'],
      req.ip
    );

    const response: ApiResponse = {
      success: true,
      data: session,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/register
 * Register a new user with local credentials.
 */
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = registerSchema.parse(req.body);
    const session = await authService.register(
      input,
      req.headers['user-agent'],
      req.ip
    );

    const response: ApiResponse = {
      success: true,
      data: session,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token.
 */
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const tokens = await tokenService.refreshTokens(
      refreshToken,
      req.headers['user-agent'],
      req.ip
    );

    if (!tokens) {
      res.status(401).json({
        success: false,
        error: { code: 'AUTH_TOKEN_INVALID', message: 'Invalid or expired refresh token' },
        meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: tokens,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/logout
 * Revoke all refresh tokens for the user.
 */
authRouter.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tokenService.revokeAllUserTokens(req.user!._id.toString());

    const response: ApiResponse = {
      success: true,
      data: { message: 'Logged out successfully' },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/me
 * Get current authenticated user.
 */
authRouter.get('/me', authenticate, async (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      id: req.user!._id.toString(),
      email: req.user!.email,
      username: req.user!.username,
      mobile: req.user!.mobile,
      displayName: req.user!.displayName,
      avatar: req.user!.avatar,
      providers: req.user!.providers.map((p) => p.provider),
      roles: req.user!.roles,
      mfaEnabled: req.user!.mfaEnabled,
    },
    meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
  };
  res.json(response);
});

/**
 * POST /auth/verify-mfa
 * Verify MFA code.
 */
authRouter.post('/verify-mfa', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const _input = mfaVerifySchema.parse(req.body);
    // MFA verification logic would go here
    // For now, return not implemented
    res.status(501).json({
      success: false,
      error: { code: 'AUTH_INTERNAL_ERROR', message: 'MFA verification not yet implemented' },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/oauth/:provider
 * Initiate OAuth flow — redirects to provider.
 */
authRouter.get('/oauth/:provider', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params;
    const validProviders = ['google', 'github', 'microsoft'];

    if (!validProviders.includes(provider)) {
      res.status(400).json({
        success: false,
        error: { code: 'AUTH_VALIDATION_ERROR', message: 'Invalid OAuth provider' },
        meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
      });
      return;
    }

    // Dynamically use passport for the provider
    const passport = (await import('passport')).default;
    passport.authenticate(provider, {
      scope: provider === 'google' ? ['profile', 'email'] : ['user:email'],
      session: false,
    })(req, res, next);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/oauth/:provider/callback
 * OAuth callback — handles token exchange server-side.
 */
authRouter.get('/oauth/:provider/callback', async (req: Request, res: Response, next: NextFunction) => {
  const { provider } = req.params;
  const passport = (await import('passport')).default;

  passport.authenticate(provider, { session: false }, async (err: any, profile: any) => {
    try {
      if (err || !profile) {
        // Redirect to frontend with error
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=oauth_failed`);
        return;
      }

      // Use auth service to find/create user
      const session = await authService.handleOAuthLogin(
        provider,
        {
          id: profile.id,
          email: profile.email,
          displayName: profile.displayName,
          avatar: profile.avatar,
        },
        req.headers['user-agent'],
        req.ip
      );

      // Redirect to frontend with tokens (via URL fragment for security)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(
        `${frontendUrl}/auth/callback#access_token=${session.tokens.accessToken}&refresh_token=${session.tokens.refreshToken}`
      );
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  })(req, res, next);
});

/**
 * POST /auth/bankid/init
 * Initiate BankID authentication (server-side only).
 */
authRouter.post('/bankid/init', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const endUserIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const result = await bankIdService.authenticate(endUserIp);

    const response: ApiResponse = {
      success: true,
      data: {
        orderRef: result.orderRef,
        autoStartToken: result.autoStartToken,
      },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/bankid/collect
 * Poll BankID authentication status (server-side only).
 * If complete, returns auth session with tokens.
 */
authRouter.post('/bankid/collect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderRef } = req.body;
    if (!orderRef || typeof orderRef !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'AUTH_VALIDATION_ERROR', message: 'orderRef is required' },
        meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
      });
      return;
    }

    const result = await bankIdService.collect(orderRef);

    if (result.status === 'complete' && result.completionData) {
      // Authentication complete — create session
      const session = await bankIdService.completeAuth(
        result.completionData,
        req.headers['user-agent'],
        req.ip
      );

      const response: ApiResponse = {
        success: true,
        data: {
          status: 'complete',
          session,
        },
        meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
      };
      res.json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: {
        status: result.status,
        hintCode: result.hintCode,
      },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/bankid/cancel
 * Cancel an ongoing BankID authentication.
 */
authRouter.post('/bankid/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderRef } = req.body;
    if (!orderRef || typeof orderRef !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'AUTH_VALIDATION_ERROR', message: 'orderRef is required' },
        meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
      });
      return;
    }

    await bankIdService.cancel(orderRef);

    const response: ApiResponse = {
      success: true,
      data: { message: 'BankID authentication cancelled' },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});
