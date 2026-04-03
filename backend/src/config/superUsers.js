/**
 * Super Users Configuration
 *
 * Super user emails are loaded from the SUPER_USER_EMAILS env var
 * (comma-separated) so real addresses are never committed to source.
 *
 * Example in .env:
 *   SUPER_USER_EMAILS=admin@example.com,you@yourorg.org
 */

const raw = process.env.SUPER_USER_EMAILS || '';
export const SUPER_USER_EMAILS = raw
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export function isSuperUserEmail(email) {
  return SUPER_USER_EMAILS.includes(email.toLowerCase().trim());
}

export default { SUPER_USER_EMAILS, isSuperUserEmail };
