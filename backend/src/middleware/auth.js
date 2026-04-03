/**
 * Authentication Middleware
 * 
 * Verify JWT tokens and protect routes
 */

import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { findUserById } from '../db/users.js';

/**
 * Authenticate JWT token
 * Middleware that verifies JWT and attaches user to request
 */
export async function authenticateToken(req, res, next) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // If temporary/guest user (not in DB yet)
    if (decoded.isTemporary) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        provider: decoded.provider,
        providerId: decoded.providerId,
        isTemporary: true
      };
      return next();
    }
    
    // Get user from database for registered users
    const user = await findUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
}

/**
 * Optional authentication
 * Attaches user if token is present, but doesn't fail if missing
 */
export async function optionalAuth(req, res, next) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await findUserById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without user
    next();
  }
}

export default {
  authenticateToken,
  optionalAuth
};
