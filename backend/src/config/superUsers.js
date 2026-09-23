/**
 * Super Users (Passport mode only)
 *
 * In Keycloak mode the `super` realm role decides this. Passport has no role
 * source, so super user emails come from the SUPER_USER_EMAILS env var
 * (comma-separated) and real addresses are never committed to source.
 *
 * Example in .env:
 *   SUPER_USER_EMAILS=admin@example.com,you@yourorg.org
 */

const SUPER_USER_EMAILS = (process.env.SUPER_USER_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export function isSuperUserEmail(email) {
  return SUPER_USER_EMAILS.includes((email || '').toLowerCase().trim());
}

export default { isSuperUserEmail };
