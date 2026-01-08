/**
 * VibeLearning Database Connection
 *
 * Manages SQLite database connection with proper initialization,
 * migration support, and connection pooling.
 */

import Database from 'better-sqlite3';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { DatabaseConnectionError } from '../core/errors.js';
import { DB_CONFIG } from '../core/constants.js';
import { SCHEMA_TABLES_SQL, SCHEMA_INIT_SQL, RESET_DAILY_STATE_SQL, CHECK_DAILY_RESET_SQL } from './schema.js';

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  /** Custom database directory path */
  readonly dbDir?: string;
  /** Database filename */
  readonly dbFilename?: string;
  /** Enable WAL mode for better concurrency */
  readonly walMode?: boolean;
  /** Enable verbose logging */
  readonly verbose?: boolean;
}

/**
 * Singleton database connection manager
 */
class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;
  private db: Database.Database | null = null;
  private readonly config: Required<DatabaseConfig>;
  private initialized = false;

  private constructor(config: DatabaseConfig = {}) {
    this.config = {
      dbDir: config.dbDir ?? path.join(os.homedir(), DB_CONFIG.DEFAULT_DIR),
      dbFilename: config.dbFilename ?? DB_CONFIG.DB_FILENAME,
      walMode: config.walMode ?? true,
      verbose: config.verbose ?? false,
    };
  }

  /**
   * Gets the singleton instance
   */
  static getInstance(config?: DatabaseConfig): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection(config);
    }
    return DatabaseConnection.instance;
  }

  /**
   * Resets the singleton instance (for testing)
   */
  static resetInstance(): void {
    if (DatabaseConnection.instance) {
      DatabaseConnection.instance.close();
      DatabaseConnection.instance = null;
    }
  }

  /**
   * Gets the database connection, initializing if needed
   */
  getDatabase(): Database.Database {
    if (!this.db) {
      this.initialize();
    }
    return this.db as Database.Database;
  }

  /**
   * Initializes the database connection and schema
   */
  private initialize(): void {
    if (this.initialized && this.db) {
      return;
    }

    try {
      // Ensure database directory exists
      this.ensureDirectoryExists(this.config.dbDir);

      const dbPath = path.join(this.config.dbDir, this.config.dbFilename);

      // Create database connection
      this.db = new Database(dbPath, {
        verbose: this.config.verbose ? console.log : undefined,
      });

      // Configure database
      this.configureDatabase();

      // Initialize schema
      this.initializeSchema();

      // Check and reset daily state if needed
      this.checkDailyReset();

      this.initialized = true;
    } catch (error) {
      throw new DatabaseConnectionError(error instanceof Error ? error : undefined);
    }
  }

  /**
   * Ensures the database directory exists
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true, mode: 0o755 });
    }
  }

  /**
   * Configures database pragmas for optimal performance
   */
  private configureDatabase(): void {
    if (!this.db) return;

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // WAL mode for better concurrency
    if (this.config.walMode) {
      this.db.pragma('journal_mode = WAL');
    }

    // Performance optimizations
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64MB cache
    this.db.pragma('temp_store = MEMORY');
  }

  /**
   * Initializes the database schema
   * Order: 1. Create tables -> 2. Run migrations -> 3. Initialize data
   */
  private initializeSchema(): void {
    if (!this.db) return;

    // 1. Create tables (minimal schema for mode_state)
    this.db.exec(SCHEMA_TABLES_SQL);

    // 2. Run migrations for existing databases (adds new columns)
    this.runMigrations();

    // 3. Initialize singleton tables with default values
    this.db.exec(SCHEMA_INIT_SQL);
  }

  /**
   * Runs database migrations for schema updates
   */
  private runMigrations(): void {
    if (!this.db) return;

    // Migration: mode TEXT -> senior_enabled/after_enabled (v0.2.0)
    this.migrateModeToToggles();
  }

  /**
   * Migrates old mode column to new senior_enabled/after_enabled columns
   * Also adds columns to fresh tables created with minimal schema
   */
  private migrateModeToToggles(): void {
    if (!this.db) return;

    // Check current table structure
    const tableInfo = this.db.prepare("PRAGMA table_info(mode_state)").all() as Array<{ name: string }>;
    const hasOldModeColumn = tableInfo.some(col => col.name === 'mode');
    const hasNewColumns = tableInfo.some(col => col.name === 'senior_enabled');

    // Case 1: Fresh table with minimal schema - just add new columns
    if (!hasOldModeColumn && !hasNewColumns) {
      this.db.exec(`
        ALTER TABLE mode_state ADD COLUMN senior_enabled INTEGER DEFAULT 1;
        ALTER TABLE mode_state ADD COLUMN after_enabled INTEGER DEFAULT 1;
      `);
      return;
    }

    // Case 2: Old table with mode column - migrate to new columns
    if (hasOldModeColumn && !hasNewColumns) {
      // Get current mode value before migration
      const row = this.db.prepare('SELECT mode FROM mode_state WHERE id = 1').get() as { mode: string } | undefined;
      const oldMode = row?.mode || 'after';

      // Determine new toggle values based on old mode
      let seniorEnabled = 1;
      let afterEnabled = 1;

      switch (oldMode) {
        case 'senior':
          seniorEnabled = 1;
          afterEnabled = 1;
          break;
        case 'senior_light':
          // senior_light -> senior on (but lighter behavior is now just senior)
          seniorEnabled = 1;
          afterEnabled = 1;
          break;
        case 'after':
          seniorEnabled = 0;
          afterEnabled = 1;
          break;
        case 'before':
          // before mode removed -> convert to senior only
          seniorEnabled = 1;
          afterEnabled = 0;
          break;
        case 'off':
          seniorEnabled = 0;
          afterEnabled = 0;
          break;
        default:
          // Default to full learning
          seniorEnabled = 1;
          afterEnabled = 1;
      }

      // Migrate schema: add new columns with migrated values
      this.db.exec(`
        ALTER TABLE mode_state ADD COLUMN senior_enabled INTEGER DEFAULT 1;
        ALTER TABLE mode_state ADD COLUMN after_enabled INTEGER DEFAULT 1;
        UPDATE mode_state SET senior_enabled = ${seniorEnabled}, after_enabled = ${afterEnabled} WHERE id = 1;
      `);

      // Note: SQLite doesn't support DROP COLUMN in older versions
      // The old 'mode' column will remain but be unused
    }

    // Case 3: Already migrated - nothing to do
  }

  /**
   * Checks if daily reset is needed and performs it
   */
  private checkDailyReset(): void {
    if (!this.db) return;

    const today = new Date().toISOString().split('T')[0];
    const row = this.db.prepare(CHECK_DAILY_RESET_SQL).get() as { last_reset_date: string } | undefined;

    if (row && row.last_reset_date !== today) {
      this.db.exec(RESET_DAILY_STATE_SQL);
    }
  }

  /**
   * Executes a transaction
   */
  transaction<T>(fn: () => T): T {
    const db = this.getDatabase();
    return db.transaction(fn)();
  }

  /**
   * Closes the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }

  /**
   * Gets the database file path
   */
  getDbPath(): string {
    return path.join(this.config.dbDir, this.config.dbFilename);
  }
}

/**
 * Gets the database connection instance
 */
export function getDatabase(config?: DatabaseConfig): Database.Database {
  return DatabaseConnection.getInstance(config).getDatabase();
}

/**
 * Gets the database connection manager
 */
export function getDatabaseConnection(config?: DatabaseConfig): DatabaseConnection {
  return DatabaseConnection.getInstance(config);
}

/**
 * Executes a transaction
 */
export function executeTransaction<T>(fn: () => T): T {
  return DatabaseConnection.getInstance().transaction(fn);
}

/**
 * Closes the database connection
 */
export function closeDatabase(): void {
  DatabaseConnection.getInstance().close();
}

/**
 * Resets the database connection (for testing)
 */
export function resetDatabase(): void {
  DatabaseConnection.resetInstance();
}

export { DatabaseConnection };
