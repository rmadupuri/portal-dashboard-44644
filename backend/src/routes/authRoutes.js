/**
 * Authentication Routes
 *
 * Keycloak mode (default): the frontend obtains tokens directly from Keycloak;
 * the backend only validates them (see middleware/auth) and exposes the current
 * user's profile.
 *
 * Passport mode (AUTH_PROVIDER=passport) adds the Google/GitHub OAuth routes
 * below, which end by redirecting to the frontend with a session token.
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { usePassport } from '../config/authProvider.js';
import passport, { enabledProviders } from '../config/passport.js';
import { signSessionToken } from '../utils/jwt.js';
import {
  getCurationTeamWorkspace,
  listActiveCurationsForUser,
  listCompletedCurationsForUser,
  listUserNotifications,
  markUserNotificationRead,
} from '../db/curationVolunteers.js';
import logger from '../utils/logger.js';

const router = express.Router();

if (usePassport) {
  const frontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:8080';

  // The token travels in the URL fragment, which browsers never send to a
  // server, so it stays out of access logs and Referer headers.
  const sendToFrontend = (res, params) =>
    res.redirect(`${frontendUrl()}/auth/callback#${new URLSearchParams(params)}`);

  const PROVIDER_SCOPES = { google: ['profile', 'email'], github: ['user:email'] };

  /**
   * @route   GET /api/auth/:provider  (google | github)
   * @desc    Start OAuth with the provider
   * @access  Public
   */
  router.get('/:provider(google|github)', (req, res, next) => {
    const { provider } = req.params;
    if (!enabledProviders.includes(provider)) {
      return sendToFrontend(res, { error: `${provider}_not_configured` });
    }
    passport.authenticate(provider, { scope: PROVIDER_SCOPES[provider], session: false })(req, res, next);
  });

  /**
   * @route   GET /api/auth/:provider/callback
   * @desc    OAuth callback; redirects to the frontend with a session token
   * @access  Public
   */
  router.get('/:provider(google|github)/callback', (req, res, next) => {
    const { provider } = req.params;
    if (!enabledProviders.includes(provider)) {
      return sendToFrontend(res, { error: `${provider}_not_configured` });
    }
    passport.authenticate(provider, { session: false }, async (err, user, info) => {
      if (err || !user) {
        if (err) logger.error(`${provider} callback error:`, err);
        return sendToFrontend(res, { error: info?.message || `${provider}_auth_failed` });
      }
      try {
        sendToFrontend(res, { token: await signSessionToken(user) });
      } catch (error) {
        logger.error(`${provider} token error:`, error);
        sendToFrontend(res, { error: 'auth_failed' });
      }
    })(req, res, next);
  });
}

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { password, ...userWithoutPassword } = req.user;
    const isSuper = req.user.role === 'super';
    const [activeCurations, completedCurations, notifications, teamWorkspace] = await Promise.all([
      isSuper ? Promise.resolve([]) : listActiveCurationsForUser(req.user.id),
      isSuper ? Promise.resolve([]) : listCompletedCurationsForUser(req.user.id),
      listUserNotifications(req.user.id),
      isSuper ? getCurationTeamWorkspace(req.user.id) : Promise.resolve(null),
    ]);
    res.json({
      status: 'success',
      data: {
        user: userWithoutPassword,
        activeAssignments: {
          count: activeCurations.length,
          studies: activeCurations,
        },
        contributions: {
          completedCurations: completedCurations.length,
          studies: completedCurations,
        },
        notifications: {
          unreadCount: notifications.unreadCount,
          items: notifications.items,
        },
        teamWorkspace,
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get profile'
    });
  }
});

router.patch('/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const updated = await markUserNotificationRead(req.params.notificationId, req.user.id);
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Notification not found' });
    }
    res.json({ status: 'success' });
  } catch (error) {
    logger.error('Mark notification read error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update notification' });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (client clears its token; in Keycloak mode it also ends the Keycloak session)
 * @access  Private
 */
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    status: 'success',
    message: 'Logged out successfully. Please remove token from client.'
  });
});

export default router;
