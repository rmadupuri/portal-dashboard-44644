/**
 * User Database Operations
 * 
 * CRUD operations for user management with LevelDB
 * OAuth-only authentication (no passwords)
 */

import { usersDb } from './index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new user (OAuth only)
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
export async function createUser(userData) {
  const userId = `user_${uuidv4()}`;
  
  const user = {
    id: userId,
    email: userData.email.toLowerCase(),
    name: userData.name || '',
    institution: userData.institution || '',
    role: userData.role || 'user', // 'user' or 'super'
    provider: userData.provider, // 'google' or 'github'
    providerId: userData.providerId, // Provider's user ID
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await usersDb.put(userId, user);
  
  return user;
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
export async function findUserByEmail(email) {
  const normalizedEmail = email.toLowerCase();
  
  try {
    for await (const [key, user] of usersDb.iterator()) {
      if (user.email === normalizedEmail) {
        return { ...user, id: key };
      }
    }
    return null;
  } catch (error) {
    if (error.code === 'LEVEL_NOT_FOUND') {
      return null;
    }
    throw error;
  }
}

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
export async function findUserById(userId) {
  try {
    const user = await usersDb.get(userId);
    return { ...user, id: userId };
  } catch (error) {
    if (error.code === 'LEVEL_NOT_FOUND') {
      return null;
    }
    throw error;
  }
}

/**
 * Find user by provider ID (for OAuth)
 * @param {string} provider - Provider name ('google', 'github')
 * @param {string} providerId - Provider's user ID
 * @returns {Promise<Object|null>} User object or null
 */
export async function findUserByProviderId(provider, providerId) {
  try {
    for await (const [key, user] of usersDb.iterator()) {
      if (user.provider === provider && user.providerId === providerId) {
        return { ...user, id: key };
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user
 */
export async function updateUser(userId, updates) {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const updatedUser = {
    ...user,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Don't allow updating certain fields
  delete updatedUser.id;
  delete updatedUser.createdAt;
  delete updatedUser.provider;
  delete updatedUser.providerId;

  await usersDb.put(userId, updatedUser);
  
  return updatedUser;
}

/**
 * Update user's last login time
 * @param {string} userId - User ID
 */
export async function updateLastLogin(userId) {
  const user = await findUserById(userId);
  if (user) {
    user.lastLogin = new Date().toISOString();
    await usersDb.put(userId, user);
  }
}

/**
 * Delete user
 * @param {string} userId - User ID
 */
export async function deleteUser(userId) {
  await usersDb.del(userId);
}

/**
 * Get all users (admin only)
 * @returns {Promise<Array>} Array of users
 */
export async function getAllUsers() {
  const users = [];
  for await (const [key, user] of usersDb.iterator()) {
    users.push({ ...user, id: key });
  }
  return users;
}

/**
 * Update user role
 * @param {string} userId - User ID
 * @param {string} role - New role ('user' or 'super')
 */
export async function updateUserRole(userId, role) {
  if (!['user', 'super'].includes(role)) {
    throw new Error('Invalid role. Must be "user" or "super"');
  }
  return updateUser(userId, { role });
}

export default {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByProviderId,
  updateUser,
  updateLastLogin,
  deleteUser,
  getAllUsers,
  updateUserRole
};
