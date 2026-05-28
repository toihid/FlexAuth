import { User, IUser } from '../models/user.model';
import { AdminConfig } from '../models/admin-config.model';
import { tokenService } from './token.service';
import { AppError } from '../middleware/error-handler';
import { LoginInput, RegisterInput } from '../validation/auth.schemas';
import { AuthSession, AuthUser } from '@flexauth/shared-types';
import { logger } from '../config/logger';

export class AuthService {
  /**
   * Local login with identifier (email/username/mobile) + password.
   * Enforces admin-controlled provider rules.
   */
  async login(
    input: LoginInput,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthSession> {
    // Verify local provider is enabled
    await this.verifyProviderEnabled('local');

    // Find user by identifier
    const user = await this.findUserByIdentifier(input.identifier, input.identifierType);
    if (!user) {
      throw new AppError(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid credentials');
    }

    // Check account lock
    if (user.isLocked()) {
      throw new AppError(423, 'AUTH_ACCOUNT_LOCKED', 'Account is temporarily locked');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AppError(403, 'AUTH_ACCOUNT_DISABLED', 'Account is disabled');
    }

    // Verify password
    const isValid = await user.comparePassword(input.password);
    if (!isValid) {
      await this.handleFailedLogin(user);
      throw new AppError(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid credentials');
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Check MFA
    if (user.mfaEnabled) {
      // Return MFA challenge instead of session
      throw new AppError(403, 'AUTH_MFA_REQUIRED', 'MFA verification required');
    }

    // Generate tokens
    const tokens = await tokenService.generateTokenPair(user, userAgent, ipAddress);

    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  /**
   * Register a new user with local credentials.
   */
  async register(
    input: RegisterInput,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthSession> {
    // Verify local provider is enabled
    await this.verifyProviderEnabled('local');

    // Check for existing user
    if (input.email) {
      const existing = await User.findOne({ email: input.email.toLowerCase() });
      if (existing) {
        throw new AppError(409, 'AUTH_VALIDATION_ERROR', 'Email already registered');
      }
    }
    if (input.username) {
      const existing = await User.findOne({ username: input.username.toLowerCase() });
      if (existing) {
        throw new AppError(409, 'AUTH_VALIDATION_ERROR', 'Username already taken');
      }
    }
    if (input.mobile) {
      const existing = await User.findOne({ mobile: input.mobile });
      if (existing) {
        throw new AppError(409, 'AUTH_VALIDATION_ERROR', 'Mobile number already registered');
      }
    }

    // Validate password against admin security config
    await this.validatePasswordStrength(input.password);

    // Create user
    const user = await User.create({
      email: input.email?.toLowerCase(),
      username: input.username?.toLowerCase(),
      mobile: input.mobile,
      displayName: input.displayName,
      passwordHash: input.password, // Will be hashed by pre-save hook
      providers: [{ provider: 'local', providerId: 'local', linkedAt: new Date() }],
    });

    const tokens = await tokenService.generateTokenPair(user, userAgent, ipAddress);

    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  /**
   * Handle OAuth callback — find or create user from OAuth profile.
   */
  async handleOAuthLogin(
    provider: string,
    profile: {
      id: string;
      email?: string;
      displayName: string;
      avatar?: string;
    },
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthSession> {
    await this.verifyProviderEnabled(provider);

    // Find existing user by provider link
    let user = await User.findOne({
      'providers.provider': provider,
      'providers.providerId': profile.id,
    });

    if (!user && profile.email) {
      // Try to link to existing user by email
      user = await User.findOne({ email: profile.email.toLowerCase() });
      if (user) {
        user.providers.push({
          provider,
          providerId: profile.id,
          email: profile.email,
          linkedAt: new Date(),
        });
        await user.save();
      }
    }

    if (!user) {
      // Create new user
      user = await User.create({
        email: profile.email?.toLowerCase(),
        displayName: profile.displayName,
        avatar: profile.avatar,
        providers: [{
          provider,
          providerId: profile.id,
          email: profile.email,
          linkedAt: new Date(),
        }],
      });
    }

    if (!user.isActive) {
      throw new AppError(403, 'AUTH_ACCOUNT_DISABLED', 'Account is disabled');
    }

    const tokens = await tokenService.generateTokenPair(user, userAgent, ipAddress);

    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  /**
   * Verify that a provider is enabled in admin config.
   * This is the critical security check — frontend cannot bypass this.
   */
  private async verifyProviderEnabled(providerType: string): Promise<void> {
    const config = await AdminConfig.findOne().sort({ updatedAt: -1 });
    if (!config) {
      logger.warn('No admin config found, allowing all providers');
      return;
    }

    const provider = config.providers.find((p) => p.type === providerType);
    if (!provider || !provider.enabled) {
      throw new AppError(403, 'AUTH_PROVIDER_DISABLED', `Provider "${providerType}" is not enabled`);
    }
  }

  private async findUserByIdentifier(
    identifier: string,
    type: string
  ): Promise<IUser | null> {
    switch (type) {
      case 'email':
        return User.findOne({ email: identifier.toLowerCase() });
      case 'username':
        return User.findOne({ username: identifier.toLowerCase() });
      case 'mobile':
        return User.findOne({ mobile: identifier });
      default:
        return null;
    }
  }

  private async handleFailedLogin(user: IUser): Promise<void> {
    const config = await AdminConfig.findOne().sort({ updatedAt: -1 });
    const maxAttempts = config?.security.maxLoginAttempts || 5;
    const lockoutMinutes = config?.security.lockoutDurationMinutes || 30;

    user.loginAttempts += 1;

    if (user.loginAttempts >= maxAttempts) {
      user.lockUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
      logger.warn('Account locked due to too many failed attempts', {
        userId: user._id,
        attempts: user.loginAttempts,
      });
    }

    await user.save();
  }

  private async validatePasswordStrength(password: string): Promise<void> {
    const config = await AdminConfig.findOne().sort({ updatedAt: -1 });
    if (!config) return;

    const { security } = config;
    const errors: string[] = [];

    if (password.length < security.passwordMinLength) {
      errors.push(`Password must be at least ${security.passwordMinLength} characters`);
    }
    if (security.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (security.passwordRequireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (security.passwordRequireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
      throw new AppError(400, 'AUTH_VALIDATION_ERROR', 'Password does not meet requirements', {
        password: errors,
      });
    }
  }

  private toAuthUser(user: IUser): AuthUser {
    return {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      mobile: user.mobile,
      displayName: user.displayName,
      avatar: user.avatar,
      providers: user.providers.map((p) => p.provider),
      roles: user.roles,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}

export const authService = new AuthService();
