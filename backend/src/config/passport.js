/**
 * Passport Configuration (AUTH_PROVIDER=passport)
 *
 * Google and GitHub OAuth. Each strategy is registered only when its client id
 * and secret are set, so a test server can run with just one of them. The verify
 * callbacks resolve the OAuth profile to an app user; authRoutes then issues the
 * session token (utils/jwt.js).
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { upsertOAuthUser } from '../db/users.js';
import { isSuperUserEmail } from './superUsers.js';
import logger from '../utils/logger.js';

/** Providers with credentials configured, e.g. ['google', 'github']. */
export const enabledProviders = [];

/**
 * Resolve a provider profile to an app user. Only a verified email is accepted:
 * the email links to existing accounts and decides super user status, so an
 * unverified one would let anyone claim someone else's identity.
 */
async function resolveUser(provider, profile, email, done) {
  try {
    if (!email) {
      return done(null, false, { message: 'no_verified_email' });
    }
    const user = await upsertOAuthUser({
      provider,
      providerId: String(profile.id),
      email,
      name: profile.displayName || profile.username || '',
      role: isSuperUserEmail(email) ? 'super' : 'user',
    });
    logger.info(`✅ ${provider} login: ${user.email} (${user.role})`);
    return done(null, user);
  } catch (error) {
    logger.error(`${provider} OAuth error:`, error);
    return done(error);
  }
}

let configured = false;

/** Register strategies. Call once, after environment variables are loaded. */
export function configurePassport() {
  if (configured) return passport;
  configured = true;

  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
      },
      (accessToken, refreshToken, profile, done) => {
        const primary = profile.emails?.[0];
        const email = primary?.verified ? primary.value : null;
        return resolveUser('google', profile, email, done);
      },
    ));
    enabledProviders.push('google');
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/github/callback`,
        scope: ['user:email'],
        // Keep GitHub's `verified` flag on each address (by default the
        // strategy returns only the primary address and drops it).
        allRawEmails: true,
      },
      (accessToken, refreshToken, profile, done) => {
        const primary = (profile.emails || []).find(e => e.primary && e.verified);
        return resolveUser('github', profile, primary?.value || null, done);
      },
    ));
    enabledProviders.push('github');
  }

  if (!enabledProviders.length) {
    logger.warn('⚠️  AUTH_PROVIDER=passport but no Google or GitHub credentials are set — nobody can log in');
  } else {
    logger.info(`✅ Passport OAuth configured: ${enabledProviders.join(', ')}`);
  }

  return passport;
}

export default passport;
