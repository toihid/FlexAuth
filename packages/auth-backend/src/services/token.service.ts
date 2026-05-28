import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { IUser } from '../models/user.model';
import { RefreshToken } from '../models/refresh-token.model';
import { AuthTokens } from '@flexauth/shared-types';

export class TokenService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || '';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || '';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  generateAccessToken(user: IUser): string {
    const options: SignOptions = { expiresIn: this.jwtExpiresIn as any };
    return jwt.sign(
      {
        userId: user._id.toString(),
        roles: user.roles,
      },
      this.jwtSecret,
      options
    );
  }

  async generateTokenPair(
    user: IUser,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(user);

    // Generate refresh token
    const refreshTokenValue = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await RefreshToken.create({
      userId: user._id,
      token: refreshTokenValue,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: this.parseExpiresIn(this.jwtExpiresIn),
    };
  }

  async refreshTokens(
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthTokens | null> {
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      revokedAt: null,
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // If token was already used, revoke all tokens for this user (token reuse detection)
      if (storedToken?.revokedAt) {
        await RefreshToken.updateMany(
          { userId: storedToken.userId },
          { revokedAt: new Date() }
        );
      }
      return null;
    }

    // Revoke old token
    storedToken.revokedAt = new Date();

    const { User } = await import('../models/user.model');
    const user = await User.findById(storedToken.userId);
    if (!user || !user.isActive) return null;

    // Generate new token pair
    const newRefreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    storedToken.replacedByToken = newRefreshToken;
    await storedToken.save();

    await RefreshToken.create({
      userId: user._id,
      token: newRefreshToken,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: newRefreshToken,
      expiresIn: this.parseExpiresIn(this.jwtExpiresIn),
    };
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await RefreshToken.updateMany(
      { userId, revokedAt: null },
      { revokedAt: new Date() }
    );
  }

  private parseExpiresIn(value: string): number {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // default 15 minutes in seconds
    const num = parseInt(match[1]);
    switch (match[2]) {
      case 's': return num;
      case 'm': return num * 60;
      case 'h': return num * 3600;
      case 'd': return num * 86400;
      default: return 900;
    }
  }
}

export const tokenService = new TokenService();
