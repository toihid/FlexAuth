import { AdminConfig, IAdminConfig } from '../models/admin-config.model';
import { ProvidersResponse, AuthProviderConfig } from '@flexauth/shared-types';
import { AppError } from '../middleware/error-handler';

export class ConfigService {
  /**
   * Get public-facing provider config.
   * CRITICAL: This strips all secrets before sending to frontend.
   * The frontend only sees what providers are enabled and their display info.
   */
  async getPublicConfig(): Promise<ProvidersResponse> {
    const config = await AdminConfig.findOne().sort({ updatedAt: -1 });
    if (!config) {
      return {
        providers: [],
        branding: { appName: 'Auth System' },
      };
    }

    // Filter to enabled providers only, strip secrets
    const providers: AuthProviderConfig[] = config.providers
      .filter((p) => p.enabled)
      .sort((a, b) => a.priority - b.priority)
      .map((p) => ({
        type: p.type as AuthProviderConfig['type'],
        enabled: true,
        displayName: p.displayName,
        supportedIdentifiers: p.supportedIdentifiers as AuthProviderConfig['supportedIdentifiers'],
        settings: p.settings, // Only non-sensitive settings
      }));

    return {
      providers,
      branding: {
        appName: config.branding.appName,
        logoUrl: config.branding.logoUrl,
        primaryColor: config.branding.primaryColor,
        accentColor: config.branding.accentColor,
      },
    };
  }

  /**
   * Get full admin config (admin-only, includes all settings).
   */
  async getAdminConfig(): Promise<IAdminConfig | null> {
    return AdminConfig.findOne().sort({ updatedAt: -1 });
  }

  /**
   * Update admin config.
   */
  async updateAdminConfig(
    updates: Partial<Pick<IAdminConfig, 'providers' | 'security' | 'branding'>>,
    updatedBy: string
  ): Promise<IAdminConfig> {
    let config = await AdminConfig.findOne().sort({ updatedAt: -1 });

    if (!config) {
      throw new AppError(404, 'AUTH_INTERNAL_ERROR', 'Admin config not found');
    }

    if (updates.providers) config.providers = updates.providers;
    if (updates.security) config.security = updates.security;
    if (updates.branding) config.branding = updates.branding;
    config.updatedBy = updatedBy;

    await config.save();
    return config;
  }
}

export const configService = new ConfigService();
