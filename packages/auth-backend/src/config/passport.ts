import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { logger } from './logger';

export function configurePassport(): void {
  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/auth/oauth/google/callback',
          scope: ['profile', 'email'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const userProfile = {
              id: profile.id,
              email: profile.emails?.[0]?.value,
              displayName: profile.displayName,
              avatar: profile.photos?.[0]?.value,
            };
            done(null, userProfile);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
    logger.info('Google OAuth strategy configured');
  }

  // Passport serialization (we use JWT, not sessions, but passport requires these)
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj: any, done) => done(null, obj));
}
