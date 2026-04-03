/**
 * JWT Utility Functions
 * 
 * Helper functions for generating and verifying JWT tokens
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

/**
 * Generate JWT token for a user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
export function generateToken(user) {
  const payload = {
    id: user.id || null, // May be null for guest users
    email: user.email,
    role: user.role,
    name: user.name,
    provider: user.provider,
    providerId: user.providerId,
    isTemporary: user.isTemporary || false
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE
  });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Generate authentication response with token and user data
 * @param {Object} user - User object
 * @returns {Object} Auth response
 */
export function generateAuthResponse(user) {
  const token = generateToken(user);
  
  // Remove sensitive data
  const { password, ...userWithoutPassword } = user;
  
  return {
    status: 'success',
    data: {
      token,
      user: userWithoutPassword
    }
  };
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

export default {
  generateToken,
  verifyToken,
  generateAuthResponse,
  extractTokenFromHeader
};
