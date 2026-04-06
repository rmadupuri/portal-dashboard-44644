/**
 * LevelDB Database Setup + ClickHouse HTTP Client
 * 
 * Creates three separate LevelDB instances:
 * - users: User accounts and authentication
 * - submissions: Data submission records
 * - sessions: Active session tokens (optional)
 * 
 * ClickHouse queries use the HTTP interface via node-fetch
 * (replaces @clickhouse/client for Node 16 compatibility)
 */

import fetch from 'node-fetch';
import { Level } from 'level';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Lightweight ClickHouse HTTP client ────────────────────────────────────
const CH_URL = process.env.CLICKHOUSE_HOST || 'https://dl96orhu96.us-east-1.aws.clickhouse.cloud';
const CH_USER = process.env.CLICKHOUSE_USERNAME || 'default';
const CH_PASS = process.env.CLICKHOUSE_PASSWORD || '';
const CH_DB = process.env.CLICKHOUSE_DATABASE || 'cgds_public_blue';

/**
 * Minimal ClickHouse client that matches the subset of the official API
 * used in this project: clickhouseClient.query({ query, format }) → .json()
 */
export const clickhouseClient = {
  query: async ({ query, format = 'JSONEachRow' }) => {
    const url = new URL('/', CH_URL);
    url.searchParams.set('database', CH_DB);
    // Append FORMAT to the SQL so ClickHouse returns the right shape
    const fullQuery = `${query.trim().replace(/;$/, '')} FORMAT ${format}`;

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': 'Basic ' + Buffer.from(`${CH_USER}:${CH_PASS}`).toString('base64'),
      },
      body: fullQuery,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`ClickHouse HTTP error ${response.status}: ${errorBody}`);
    }

    const text = await response.text();

    return {
      /** Parse the response as JSON. For JSONEachRow, each line is a JSON object. */
      json: () => {
        if (!text.trim()) return [];
        if (format === 'JSONEachRow') {
          return text.trim().split('\n').map(line => JSON.parse(line));
        }
        // For other formats (e.g. JSON), parse the whole thing
        return JSON.parse(text);
      },
    };
  },
};

// Database path - stores in project root/data directory
const dbPath = path.join(__dirname, '../../data');

console.log('📁 LevelDB path:', dbPath);

// Create three separate databases with JSON encoding
export const usersDb = new Level(path.join(dbPath, 'users'), { 
  valueEncoding: 'json' 
});

export const submissionsDb = new Level(path.join(dbPath, 'submissions'), { 
  valueEncoding: 'json' 
});

export const sessionsDb = new Level(path.join(dbPath, 'sessions'), { 
  valueEncoding: 'json' 
});

// Initialize databases
export async function initializeDatabases() {
  try {
    await usersDb.open();
    await submissionsDb.open();
    await sessionsDb.open();
    console.log('✅ LevelDB databases initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize databases:', error);
    throw error;
  }
}

// Close databases
export async function closeDatabases() {
  try {
    await usersDb.close();
    await submissionsDb.close();
    await sessionsDb.close();
    console.log('✅ LevelDB databases closed successfully');
  } catch (error) {
    console.error('❌ Failed to close databases:', error);
    throw error;
  }
}

// Helper function to get all entries from a database
export async function getAllEntries(db) {
  const entries = [];
  for await (const [key, value] of db.iterator()) {
    entries.push({ key, ...value });
  }
  return entries;
}

// Helper function to delete all entries (for testing)
export async function clearDatabase(db) {
  const keys = [];
  for await (const [key] of db.iterator()) {
    keys.push(key);
  }
  for (const key of keys) {
    await db.del(key);
  }
}

export default {
  usersDb,
  submissionsDb,
  sessionsDb,
  initializeDatabases,
  getAllEntries,
  clearDatabase
};
