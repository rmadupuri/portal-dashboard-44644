/**
 * Bootstrap File - Loads environment before starting server
 * 
 * This file ensures environment variables are loaded
 * before any other modules are imported
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Verify required OAuth credentials
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('❌ ERROR: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
  console.error('   Current values:');
  console.error('   GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID || 'NOT SET');
  console.error('   GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
  console.error('   Get credentials from: https://console.cloud.google.com');
  process.exit(1);
}

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  console.error('❌ ERROR: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set in .env');
  console.error('   Current values:');
  console.error('   GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID || 'NOT SET');
  console.error('   GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET ? 'SET' : 'NOT SET');
  console.error('   Get credentials from: https://github.com/settings/developers');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log('   GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...');
console.log('   GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID);

// Now import and start the server
import('./server.js');
