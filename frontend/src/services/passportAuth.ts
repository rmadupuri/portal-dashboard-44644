import { API_URL } from '@/config';

/**
 * Passport-mode authentication (VITE_AUTH_PROVIDER=passport).
 *
 * The backend runs the Google/GitHub OAuth dance and redirects back to
 * /auth/callback with its own session token in the URL fragment. The token is
 * kept in `localStorage.authToken`, the same key Keycloak mode mirrors into, so
 * the API helpers and ProtectedRoute work unchanged. services/keycloak.ts
 * delegates here; nothing else should import this module.
 */

const TOKEN_KEY = 'authToken';
const RETURN_KEY = 'authReturnTo';

interface SessionClaims {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
}

/** Read a token's claims without verifying it — the API does that. */
function decode(token: string): SessionClaims | null {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), '=')));
  } catch {
    return null;
  }
}

/** The stored token, or null when missing or expired (an expired one is dropped). */
export function currentToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const claims = decode(token);
  if (!claims?.exp || claims.exp * 1000 <= Date.now()) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
  return token;
}

/**
 * Pick up the backend's redirect to /auth/callback, if this page load is one.
 *
 * Runs before the router mounts, so the address is rewritten to the page the
 * user started from and the callback URL (with the token in it) never reaches
 * history or renders as a 404.
 */
export function consumeAuthCallback() {
  if (window.location.pathname !== '/auth/callback') return;

  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get('token');
  const returnTo = sessionStorage.getItem(RETURN_KEY) || '/';
  sessionStorage.removeItem(RETURN_KEY);

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    window.history.replaceState(null, '', returnTo);
  } else {
    const error = params.get('error') || 'auth_failed';
    const query = new URLSearchParams({ error });
    if (returnTo !== '/') query.set('returnTo', returnTo);
    window.history.replaceState(null, '', `/login?${query}`);
  }
}

export function tokenIdentity(): { email: string; isSuperUser: boolean } | null {
  const token = currentToken();
  const claims = token ? decode(token) : null;
  if (!claims) return null;
  return { email: claims.email ?? '', isSuperUser: claims.role === 'super' };
}

/** Send the browser to the backend's OAuth start route for `provider`. */
export function login(provider: 'google' | 'github' | undefined, returnPath: string) {
  if (!provider) {
    window.location.assign(`/login?returnTo=${encodeURIComponent(returnPath)}`);
    return;
  }
  sessionStorage.setItem(RETURN_KEY, returnPath);
  window.location.assign(`${API_URL}/api/auth/${provider}`);
}

/** Session tokens are stateless, so logging out only forgets ours. */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  window.location.assign('/');
}
