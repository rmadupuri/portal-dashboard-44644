import dotenv from 'dotenv';
import logger from './utils/logger.js';
dotenv.config();

// Passport mode (AUTH_PROVIDER=passport) signs its own session tokens and has
// no Keycloak to point at; see config/authProvider.js.
const required = (process.env.AUTH_PROVIDER || 'keycloak').trim().toLowerCase() === 'passport'
  ? ['JWT_SECRET']
  : ['KEYCLOAK_ISSUER'];
// In production, FRONTEND_URL must be set explicitly so CORS never silently
// falls back to the localhost dev origin (see server.js cors config).
if (process.env.NODE_ENV === 'production') {
  required.push('FRONTEND_URL');
}
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  logger.error(`❌ Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

import('./server.js');
