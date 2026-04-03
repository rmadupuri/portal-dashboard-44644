/**
 * Passport Configuration Factory
 * 
 * Returns configured passport instance with OAuth strategies
 * This must be called AFTER environment variables are loaded
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { findUserByProviderId, findUserByEmail, createUser, updateUser, updateLastLogin } from '../db/users.js';
import { isSuperUserEmail } from './superUsers.js';

let isConfigured = false;

/**
 * Configure passport with OAuth strategies
 * MUST be called after dotenv.config()
 */
export function configurePassport() {
  if (isConfigured) {
    return passport;
  }

  // OAuth credentials from environment
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          
          // Check if user already exists by provider ID or email
          let user = await findUserByProviderId('google', profile.id);
          if (!user) {
            user = await findUserByEmail(email);
          }

          if (!user) {
            // Only auto-create user if they are a super user
            if (isSuperUserEmail(email)) {
              user = await createUser({
                email,
                name: profile.displayName,
                provider: 'google',
                providerId: profile.id,
                role: 'super'
              });
              console.log(`✅ Super user created via Google: ${user.email}`);
            } else {
              // Regular users are NOT created automatically
              // They will be created when they submit via /api/tracker
              // For now, return minimal user info for JWT
              user = {
                email,
                name: profile.displayName,
                provider: 'google',
                providerId: profile.id,
                role: 'guest', // Temporary role
                isTemporary: true // Flag to indicate not in DB
              };
              console.log(`✅ Guest user logged in via Google: ${email}`);
            }
          } else {
            // Always enforce super user role from config — in case record was created before super user logic
            const expectedRole = isSuperUserEmail(email) ? 'super' : user.role;
            const userId = user.id;
            if (user.role !== expectedRole) {
              user = { ...await updateUser(userId, { role: expectedRole }), id: userId };
              console.log(`✅ Role updated to '${expectedRole}' for: ${email}`);
            }
            if (!user.isTemporary) {
              await updateLastLogin(userId);
            }
            console.log(`✅ User logged in via Google: ${user.email}`);
          }

          return done(null, user);
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );

  // GitHub OAuth Strategy
  passport.use(
    new GitHubStrategy(
      {
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/github/callback`,
        scope: ['user:email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Get primary email
          const email = profile.emails && profile.emails[0] 
            ? profile.emails[0].value 
            : `${profile.username}@github.com`;

          // Check if user already exists by provider ID or email
          let user = await findUserByProviderId('github', profile.id);
          if (!user) {
            user = await findUserByEmail(email);
          }

          if (!user) {
            // Only auto-create user if they are a super user
            if (isSuperUserEmail(email)) {
              user = await createUser({
                email,
                name: profile.displayName || profile.username,
                provider: 'github',
                providerId: profile.id,
                role: 'super'
              });
              console.log(`✅ Super user created via GitHub: ${user.email}`);
            } else {
              // Regular users are NOT created automatically
              // They will be created when they submit via /api/tracker
              // For now, return minimal user info for JWT
              user = {
                email,
                name: profile.displayName || profile.username,
                provider: 'github',
                providerId: profile.id,
                role: 'guest', // Temporary role
                isTemporary: true // Flag to indicate not in DB
              };
              console.log(`✅ Guest user logged in via GitHub: ${email}`);
            }
          } else {
            // Always enforce super user role from config — in case record was created before super user logic
            const expectedRole = isSuperUserEmail(email) ? 'super' : user.role;
            const userId = user.id;
            if (user.role !== expectedRole) {
              user = { ...await updateUser(userId, { role: expectedRole }), id: userId };
              console.log(`✅ Role updated to '${expectedRole}' for: ${email}`);
            }
            if (!user.isTemporary) {
              await updateLastLogin(userId);
            }
            console.log(`✅ User logged in via GitHub: ${user.email}`);
          }

          return done(null, user);
        } catch (error) {
          console.error('GitHub OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );

  isConfigured = true;
  console.log('✅ Google OAuth configured');
  console.log('✅ GitHub OAuth configured');

  return passport;
}

export default passport;
