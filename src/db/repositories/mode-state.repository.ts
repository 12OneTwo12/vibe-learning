/**
 * ModeState Repository
 *
 * Data access layer for learning mode management.
 * New architecture: independent senior/after toggles.
 */

import type Database from 'better-sqlite3';
import type { ModeState } from '../../types/index.js';
import { getDatabase } from '../connection.js';
import { DatabaseQueryError } from '../../core/errors.js';

/**
 * Raw database row type for mode_state table
 */
interface ModeStateRow {
  id: number;
  senior_enabled: number;
  after_enabled: number;
  paused_until: string | null;
  focus_area: string | null;
}

/**
 * Converts a database row to domain model
 */
function rowToModel(row: ModeStateRow): ModeState {
  return {
    seniorEnabled: row.senior_enabled === 1,
    afterEnabled: row.after_enabled === 1,
    pausedUntil: row.paused_until ? new Date(row.paused_until) : null,
    focusArea: row.focus_area,
  };
}

/**
 * Input for updating mode state
 */
export interface UpdateModeInput {
  readonly seniorEnabled?: boolean;
  readonly afterEnabled?: boolean;
  readonly pausedUntil?: Date | null;
  readonly focusArea?: string | null;
}

/**
 * Repository for mode state operations
 */
export class ModeStateRepository {
  private readonly db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db ?? getDatabase();
  }

  /**
   * Gets the current mode state
   */
  get(): ModeState {
    try {
      // Check if pause has expired
      this.checkAndClearExpiredPause();

      const stmt = this.db.prepare('SELECT * FROM mode_state WHERE id = 1');
      const row = stmt.get() as ModeStateRow;
      return rowToModel(row);
    } catch (error) {
      throw new DatabaseQueryError('get', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Sets senior mode enabled/disabled
   */
  setSeniorEnabled(enabled: boolean): ModeState {
    try {
      const stmt = this.db.prepare(`
        UPDATE mode_state
        SET senior_enabled = ?
        WHERE id = 1
      `);
      stmt.run(enabled ? 1 : 0);
      return this.get();
    } catch (error) {
      throw new DatabaseQueryError('setSeniorEnabled', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Sets after mode enabled/disabled
   */
  setAfterEnabled(enabled: boolean): ModeState {
    try {
      const stmt = this.db.prepare(`
        UPDATE mode_state
        SET after_enabled = ?
        WHERE id = 1
      `);
      stmt.run(enabled ? 1 : 0);
      return this.get();
    } catch (error) {
      throw new DatabaseQueryError('setAfterEnabled', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Sets both senior and after modes
   */
  setModes(seniorEnabled: boolean, afterEnabled: boolean): ModeState {
    try {
      const stmt = this.db.prepare(`
        UPDATE mode_state
        SET senior_enabled = ?, after_enabled = ?
        WHERE id = 1
      `);
      stmt.run(seniorEnabled ? 1 : 0, afterEnabled ? 1 : 0);
      return this.get();
    } catch (error) {
      throw new DatabaseQueryError('setModes', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Pauses learning until specified time
   */
  pauseUntil(until: Date): ModeState {
    try {
      const stmt = this.db.prepare(`
        UPDATE mode_state
        SET paused_until = ?
        WHERE id = 1
      `);
      stmt.run(until.toISOString());
      return this.get();
    } catch (error) {
      throw new DatabaseQueryError('pauseUntil', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Clears the pause
   */
  clearPause(): ModeState {
    try {
      const stmt = this.db.prepare(`
        UPDATE mode_state
        SET paused_until = NULL
        WHERE id = 1
      `);
      stmt.run();
      return this.get();
    } catch (error) {
      throw new DatabaseQueryError('clearPause', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Sets focus area for questions
   */
  setFocusArea(area: string | null): ModeState {
    try {
      const stmt = this.db.prepare(`
        UPDATE mode_state
        SET focus_area = ?
        WHERE id = 1
      `);
      stmt.run(area);
      return this.get();
    } catch (error) {
      throw new DatabaseQueryError('setFocusArea', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Updates mode state with multiple fields
   */
  update(input: UpdateModeInput): ModeState {
    try {
      const updates: string[] = [];
      const values: (string | number | null)[] = [];

      if (input.seniorEnabled !== undefined) {
        updates.push('senior_enabled = ?');
        values.push(input.seniorEnabled ? 1 : 0);
      }

      if (input.afterEnabled !== undefined) {
        updates.push('after_enabled = ?');
        values.push(input.afterEnabled ? 1 : 0);
      }

      if (input.pausedUntil !== undefined) {
        updates.push('paused_until = ?');
        values.push(input.pausedUntil?.toISOString() ?? null);
      }

      if (input.focusArea !== undefined) {
        updates.push('focus_area = ?');
        values.push(input.focusArea);
      }

      if (updates.length === 0) {
        return this.get();
      }

      const stmt = this.db.prepare(`
        UPDATE mode_state
        SET ${updates.join(', ')}
        WHERE id = 1
      `);
      stmt.run(...values);

      return this.get();
    } catch (error) {
      throw new DatabaseQueryError('update', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Checks if paused and clears if expired
   */
  private checkAndClearExpiredPause(): void {
    try {
      const stmt = this.db.prepare('SELECT paused_until FROM mode_state WHERE id = 1');
      const row = stmt.get() as { paused_until: string | null } | undefined;

      if (row?.paused_until) {
        const pausedUntil = new Date(row.paused_until);
        if (pausedUntil.getTime() < Date.now()) {
          this.clearPause();
        }
      }
    } catch (error) {
      throw new DatabaseQueryError('checkAndClearExpiredPause', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Checks if currently paused
   */
  isPaused(): boolean {
    const state = this.get();
    return state.pausedUntil !== null && state.pausedUntil.getTime() > Date.now();
  }

  /**
   * Checks if learning is effectively off (both modes disabled or paused)
   */
  isLearningOff(): boolean {
    if (this.isPaused()) {
      return true;
    }
    const state = this.get();
    return !state.seniorEnabled && !state.afterEnabled;
  }

  /**
   * Checks if senior mode is effectively active
   */
  isSeniorActive(): boolean {
    if (this.isPaused()) {
      return false;
    }
    const state = this.get();
    return state.seniorEnabled;
  }

  /**
   * Checks if after mode is effectively active
   */
  isAfterActive(): boolean {
    if (this.isPaused()) {
      return false;
    }
    const state = this.get();
    return state.afterEnabled;
  }
}
