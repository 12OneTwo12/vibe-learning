/**
 * Test Setup
 *
 * Common test utilities and setup for all tests.
 */

import { beforeEach, afterEach, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { resetDatabase, getDatabaseConnection } from '../src/db/index.js';
import { resetToolHandlers } from '../src/tools/index.js';

/**
 * Test database directory
 */
export const TEST_DB_DIR = path.join(os.tmpdir(), 'vibe-learning-test');

/**
 * Creates a clean test database
 */
export function setupTestDatabase(): void {
  // Ensure test directory exists
  if (!fs.existsSync(TEST_DB_DIR)) {
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
  }

  // Clean up any existing test database
  const dbPath = path.join(TEST_DB_DIR, 'learning.db');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  // Also clean WAL and SHM files
  const walPath = dbPath + '-wal';
  const shmPath = dbPath + '-shm';
  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

  // Initialize database connection with test directory
  getDatabaseConnection({ dbDir: TEST_DB_DIR });
}

/**
 * Cleans up test database
 */
export function cleanupTestDatabase(): void {
  resetDatabase();
  resetToolHandlers();

  // Remove test directory
  if (fs.existsSync(TEST_DB_DIR)) {
    fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
  }
}

/**
 * Global test setup
 */
export function setupTests(): void {
  beforeEach(() => {
    setupTestDatabase();
  });

  afterEach(() => {
    resetDatabase();
    resetToolHandlers();
  });

  afterAll(() => {
    cleanupTestDatabase();
  });
}
