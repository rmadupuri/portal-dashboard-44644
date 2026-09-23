/**
 * Token Utility Functions
 *
 * In Keycloak mode the backend issues no tokens of its own (they are validated
 * in middleware/auth via JWKS). In Passport mode (AUTH_PROVIDER=passport) it
 * signs an HS256 session token after the OAuth callback, carrying the app user
 * id as `sub`.
 */

import { SignJWT, jwtVerify } from 'jose';

const ISSUER = 'curation-dashboard';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

/**
 * Sign a session token for an app user (Passport mode).
 * @param {{id:string, email:string, name?:string, role:string}} user
 * @returns {Promise<string>}
 */
export function signSessionToken(user) {
  return new SignJWT({ email: user.email, name: user.name || '', role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRE)
    .sign(secretKey());
}

/**
 * Verify a session token (Passport mode). Throws if invalid or expired.
 * @returns {Promise<Object>} the token payload
 */
export async function verifySessionToken(token) {
  const { payload } = await jwtVerify(token, secretKey(), {
    issuer: ISSUER,
    algorithms: ['HS256'],
  });
  return payload;
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
  signSessionToken,
  verifySessionToken,
  extractTokenFromHeader,
};
