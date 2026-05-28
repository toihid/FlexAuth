import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required').max(255),
  identifierType: z.enum(['email', 'username', 'mobile']),
  password: z.string().min(1, 'Password is required').max(128),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email').optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
    .optional(),
  mobile: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Invalid mobile number format (use E.164)')
    .optional(),
  displayName: z.string().min(1).max(100),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
}).refine(
  (data) => data.email || data.username || data.mobile,
  { message: 'At least one identifier (email, username, or mobile) is required' }
);

export const mfaVerifySchema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().length(6, 'MFA code must be 6 digits').regex(/^\d+$/, 'MFA code must be numeric'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;
