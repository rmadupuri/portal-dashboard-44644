/**
 * Which authentication backend is active.
 *
 *   AUTH_PROVIDER=keycloak (default) — Keycloak issues tokens; we validate via JWKS.
 *   AUTH_PROVIDER=passport           — Google/GitHub OAuth through Passport; this
 *                                      API issues its own HS256 session tokens.
 *
 * Passport mode exists for internal test servers that are served over plain
 * HTTP, where keycloak-js cannot run (it needs a secure context for Web Crypto).
 * Must match the frontend's VITE_AUTH_PROVIDER.
 */

export const AUTH_PROVIDER = (process.env.AUTH_PROVIDER || 'keycloak').trim().toLowerCase();

if (!['keycloak', 'passport'].includes(AUTH_PROVIDER)) {
  throw new Error(`AUTH_PROVIDER must be "keycloak" or "passport", got "${AUTH_PROVIDER}"`);
}

export const usePassport = AUTH_PROVIDER === 'passport';
