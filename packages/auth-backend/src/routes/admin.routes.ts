import { Router, Request, Response, NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { configService } from '../services/config.service';
import { ApiResponse } from '@flexauth/shared-types';

export const adminRouter: RouterType = Router();

// All admin routes require authentication + admin role
adminRouter.use(authenticate);
adminRouter.use(requireRole('admin'));

/**
 * GET /admin/config
 * Get full admin configuration (includes sensitive settings).
 */
adminRouter.get('/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await configService.getAdminConfig();

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
 * PUT /admin/config
 * Update admin configuration.
 */
adminRouter.put('/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providers, security, branding } = req.body;
    const updatedConfig = await configService.updateAdminConfig(
      { providers, security, branding },
      req.user!._id.toString()
    );

    const response: ApiResponse = {
      success: true,
      data: updatedConfig,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /admin/config/providers
 * Update only provider configuration.
 */
adminRouter.put('/config/providers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providers } = req.body;
    if (!Array.isArray(providers)) {
      res.status(400).json({
        success: false,
        error: { code: 'AUTH_VALIDATION_ERROR', message: 'providers must be an array' },
        meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
      });
      return;
    }

    const updatedConfig = await configService.updateAdminConfig(
      { providers },
      req.user!._id.toString()
    );

    const response: ApiResponse = {
      success: true,
      data: updatedConfig,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /admin/config/security
 * Update security settings.
 */
adminRouter.put('/config/security', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { security } = req.body;
    const updatedConfig = await configService.updateAdminConfig(
      { security },
      req.user!._id.toString()
    );

    const response: ApiResponse = {
      success: true,
      data: updatedConfig,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /admin/config/branding
 * Update branding settings.
 */
adminRouter.put('/config/branding', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { branding } = req.body;
    const updatedConfig = await configService.updateAdminConfig(
      { branding },
      req.user!._id.toString()
    );

    const response: ApiResponse = {
      success: true,
      data: updatedConfig,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});
