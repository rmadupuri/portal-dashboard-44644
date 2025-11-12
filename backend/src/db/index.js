/**
 * LevelDB Database Setup
 * 
 * Creates three separate LevelDB instances:
 * - users: User accounts and authentication
 * - submissions: Data submission records
 * - sessions: Active session tokens (optional)
 */

import { Level } from 'level';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
