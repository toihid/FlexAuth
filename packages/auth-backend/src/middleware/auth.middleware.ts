import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler';
import { User, IUser } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'AUTH_TOKEN_INVALID', 'No valid token provided');
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError(500, 'AUTH_INTERNAL_ERROR', 'Server configuration error');
    }

    const decoded = jwt.verify(token, secret) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw new AppError(401, 'AUTH_TOKEN_INVALID', 'User not found or inactive');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'AUTH_TOKEN_EXPIRED', 'Token has expired'));
      return;
    }
    next(new AppError(401, 'AUTH_TOKEN_INVALID', 'Invalid token'));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'AUTH_TOKEN_INVALID', 'Authentication required'));
      return;
    }

    const hasRole = roles.some((role) => req.user!.roles.includes(role));
    if (!hasRole) {
      next(new AppError(403, 'AUTH_FORBIDDEN', 'Insufficient permissions'));
      return;
    }

    next();
  };
}
