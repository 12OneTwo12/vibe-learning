/**
 * SessionState Repository
 *
 * Data access layer for session state management (fatigue tracking).
 */

import type Database from 'better-sqlite3';
import type { SessionState } from '../../types/index.js';
import { getDatabase } from '../connection.js';
import { DatabaseQueryError } from '../../core/errors.js';
import { formatDateString } from '../../core/utils.js';

/**
 * Raw database row type for session_state table
 */
interface SessionStateRow {
  id: number;
  questions_today: number;
  last_question_at: string | null;
  consecutive_skips: number;
  last_reset_date: string;
}

/**
 * Converts a database row to domain model
 */
function rowToModel(row: SessionStateRow): SessionState {
  return {
    questionsToday: row.questions_today,
    // SQLite datetime('now') returns UTC, append 'Z' to parse as UTC
    lastQuestionAt: row.last_question_at ? new Date(row.last_question_at + 'Z') : null,
    consecutiveSkips: row.consecutive_skips,
  };
}

/**
 * Repository for session state operations
 */
export class SessionStateRepository {
  private readonly db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db ?? getDatabase();
  }

  /**
   * Gets the current session state
   */
  get(): SessionState {
    try {
      // Check if daily reset is needed
      this.checkAndResetDaily();

      const stmt = this.db.prepare('SELECT * FROM session_state WHERE id = 1');
      const row = stmt.get() as SessionStateRow;
      return rowToModel(row);
    } catch (error) {
      throw new DatabaseQueryError('get', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Increments the question count and records the timestamp
   */
  recordQuestion(): SessionState {
    try {
      const stmt = this.db.prepare(`
        UPDATE session_state
        SET questions_today = questions_today + 1,
            last_question_at = datetime('now'),
            consecutive_skips = 0
        WHERE id = 1
      `);
      stmt.run();
      return this.get();
    } catch (error) {
      throw new DatabaseQueryError('recordQuestion', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Records a skip
   */
  recordSkip(): SessionState {
    try {
      const stmt = this.db.prepare(`
        UPDATE session_state
        SET consecutive_skips = consecutive_skips + 1
        WHERE id = 1
      `);
      stmt.run();
      return this.get();
    } catch (error) {
      throw new DatabaseQueryError('recordSkip', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Resets consecutive skips (after answering)
   */
  resetSkips(): SessionState {
    try {
      const stmt = this.db.prepare(`
        UPDATE session_state
        SET consecutive_skips = 0
        WHERE id = 1
      `);
      stmt.run();
      return this.get();
    } catch (error) {
      throw new DatabaseQueryError('resetSkips', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Resets all session state for a new day
   */
  resetDaily(): SessionState {
    try {
      const stmt = this.db.prepare(`
        UPDATE session_state
        SET questions_today = 0,
            consecutive_skips = 0,
            last_reset_date = date('now')
        WHERE id = 1
      `);
      stmt.run();
      return this.get();
    } catch (error) {
      throw new DatabaseQueryError('resetDaily', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Checks if daily reset is needed and performs it
   */
  private checkAndResetDaily(): void {
    try {
      const today = formatDateString(new Date());
      const stmt = this.db.prepare('SELECT last_reset_date FROM session_state WHERE id = 1');
      const row = stmt.get() as { last_reset_date: string } | undefined;

      if (row && row.last_reset_date !== today) {
        this.resetDaily();
      }
    } catch (error) {
      throw new DatabaseQueryError('checkAndResetDaily', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Updates the last question timestamp (for manual adjustment)
   */
  updateLastQuestionAt(timestamp: Date): SessionState {
    try {
      const stmt = this.db.prepare(`
        UPDATE session_state
        SET last_question_at = ?
        WHERE id = 1
      `);
      stmt.run(timestamp.toISOString());
      return this.get();
    } catch (error) {
      throw new DatabaseQueryError('updateLastQuestionAt', error instanceof Error ? error : undefined);
    }
  }
}
