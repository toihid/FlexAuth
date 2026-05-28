import { AdminConfig } from '../models/admin-config.model';
import { logger } from '../config/logger';

/**
 * Seed default admin configuration if none exists.
 * This ensures the system has a baseline config on first run.
 */
export async function seedAdminConfig(): Promise<void> {
  const existing = await AdminConfig.findOne();
  if (existing) {
    logger.debug('Admin config already exists, skipping seed');
    return;
  }

  await AdminConfig.create({
    providers: [
      {
        type: 'local',
        enabled: true,
        displayName: 'Email & Password',
        priority: 1,
        supportedIdentifiers: ['email', 'username', 'mobile'],
        secrets: {},
        settings: {},
      },
      {
        type: 'google',
        enabled: false,
        displayName: 'Google',
        priority: 2,
        supportedIdentifiers: ['email'],
        secrets: {},
        settings: {},
      },
      {
        type: 'github',
        enabled: false,
        displayName: 'GitHub',
        priority: 3,
        supportedIdentifiers: ['email'],
        secrets: {},
        settings: {},
      },
      {
        type: 'microsoft',
        enabled: false,
        displayName: 'Microsoft',
        priority: 4,
        supportedIdentifiers: ['email'],
        secrets: {},
        settings: {},
      },
      {
        type: 'bankid',
        enabled: false,
        displayName: 'BankID',
        priority: 5,
        supportedIdentifiers: ['mobile'],
        secrets: {},
        settings: { environment: 'test' },
      },
    ],
    security: {
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 30,
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireNumbers: true,
      passwordRequireSymbols: false,
      sessionTimeoutMinutes: 60,
      mfaEnabled: false,
      mfaMethods: ['totp'],
    },
    branding: {
      appName: 'Auth Ecosystem',
      primaryColor: '#1976d2',
      accentColor: '#dc004e',
    },
    updatedBy: 'system',
  });

  logger.info('Default admin config created');
}
