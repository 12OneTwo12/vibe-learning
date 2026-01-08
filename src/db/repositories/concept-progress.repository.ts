/**
 * ConceptProgress Repository
 *
 * Data access layer for concept progress tracking with SM-2 states.
 */

import type Database from 'better-sqlite3';
import type { ConceptProgress, ConceptLevel } from '../../types/index.js';
import { getDatabase } from '../connection.js';
import { DatabaseQueryError } from '../../core/errors.js';
import { SM2_CONFIG, LEVEL_CONFIG } from '../../core/constants.js';
import { formatDateString, addDays } from '../../core/utils.js';

/**
 * Raw database row type for concept_progress table
 */
interface ConceptProgressRow {
  concept_id: string;
  current_level: number;
  easiness_factor: number;
  interval_days: number;
  next_review: string | null;
  total_attempts: number;
  correct_count: number;
  created_at: string;
}

/**
 * Input for updating concept progress
 */
export interface UpdateProgressInput {
  readonly currentLevel?: ConceptLevel;
  readonly easinessFactor?: number;
  readonly intervalDays?: number;
  readonly nextReview?: Date;
  readonly incrementAttempts?: boolean;
  readonly incrementCorrect?: boolean;
}

/**
 * Converts a database row to domain model
 */
function rowToModel(row: ConceptProgressRow): ConceptProgress {
  return {
    conceptId: row.concept_id,
    currentLevel: row.current_level as ConceptLevel,
    easinessFactor: row.easiness_factor,
    intervalDays: row.interval_days,
    nextReview: row.next_review ? new Date(row.next_review) : null,
    totalAttempts: row.total_attempts,
    correctCount: row.correct_count,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Repository for concept progress operations
 */
export class ConceptProgressRepository {
  private readonly db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db ?? getDatabase();
  }

  /**
   * Finds a concept progress by ID
   */
  findById(conceptId: string): ConceptProgress | null {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM concept_progress WHERE concept_id = ?
      `);
      const row = stmt.get(conceptId) as ConceptProgressRow | undefined;
      return row ? rowToModel(row) : null;
    } catch (error) {
      throw new DatabaseQueryError('findById', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Gets or creates a concept progress entry
   */
  getOrCreate(conceptId: string): ConceptProgress {
    try {
      const existing = this.findById(conceptId);
      if (existing) {
        return existing;
      }

      // Create new concept with default values
      // Start at Level 3 (mid-level) to respect experienced developers
      const nextReview = addDays(new Date(), SM2_CONFIG.INITIAL_INTERVAL);
      const stmt = this.db.prepare(`
        INSERT INTO concept_progress (
          concept_id, current_level, easiness_factor, interval_days, next_review
        ) VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        conceptId,
        LEVEL_CONFIG.DEFAULT_LEVEL,
        SM2_CONFIG.DEFAULT_EASINESS_FACTOR,
        SM2_CONFIG.INITIAL_INTERVAL,
        formatDateString(nextReview)
      );

      return this.findById(conceptId) as ConceptProgress;
    } catch (error) {
      throw new DatabaseQueryError('getOrCreate', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Updates concept progress
   */
  update(conceptId: string, input: UpdateProgressInput): ConceptProgress {
    try {
      const updates: string[] = [];
      const values: (string | number)[] = [];

      if (input.currentLevel !== undefined) {
        updates.push('current_level = ?');
        values.push(input.currentLevel);
      }

      if (input.easinessFactor !== undefined) {
        updates.push('easiness_factor = ?');
        values.push(input.easinessFactor);
      }

      if (input.intervalDays !== undefined) {
        updates.push('interval_days = ?');
        values.push(input.intervalDays);
      }

      if (input.nextReview !== undefined) {
        updates.push('next_review = ?');
        values.push(formatDateString(input.nextReview));
      }

      if (input.incrementAttempts) {
        updates.push('total_attempts = total_attempts + 1');
      }

      if (input.incrementCorrect) {
        updates.push('correct_count = correct_count + 1');
      }

      if (updates.length === 0) {
        return this.findById(conceptId) as ConceptProgress;
      }

      values.push(conceptId);
      const stmt = this.db.prepare(`
        UPDATE concept_progress
        SET ${updates.join(', ')}
        WHERE concept_id = ?
      `);
      stmt.run(...values);

      return this.findById(conceptId) as ConceptProgress;
    } catch (error) {
      throw new DatabaseQueryError('update', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Gets all concepts due for review
   */
  getDueForReview(limit = 10): readonly ConceptProgress[] {
    try {
      const today = formatDateString(new Date());
      const stmt = this.db.prepare(`
        SELECT * FROM concept_progress
        WHERE next_review IS NOT NULL AND next_review <= ?
        ORDER BY next_review ASC
        LIMIT ?
      `);
      const rows = stmt.all(today, limit) as ConceptProgressRow[];
      return rows.map(rowToModel);
    } catch (error) {
      throw new DatabaseQueryError('getDueForReview', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Gets concepts by level
   */
  getByLevel(level: ConceptLevel): readonly ConceptProgress[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM concept_progress
        WHERE current_level = ?
        ORDER BY created_at DESC
      `);
      const rows = stmt.all(level) as ConceptProgressRow[];
      return rows.map(rowToModel);
    } catch (error) {
      throw new DatabaseQueryError('getByLevel', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Gets all concepts
   */
  getAll(): readonly ConceptProgress[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM concept_progress
        ORDER BY created_at DESC
      `);
      const rows = stmt.all() as ConceptProgressRow[];
      return rows.map(rowToModel);
    } catch (error) {
      throw new DatabaseQueryError('getAll', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Counts total concepts
   */
  count(): number {
    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM concept_progress');
      const row = stmt.get() as { count: number };
      return row.count;
    } catch (error) {
      throw new DatabaseQueryError('count', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Calculates average level
   */
  getAverageLevel(): number {
    try {
      const stmt = this.db.prepare('SELECT AVG(current_level) as avg FROM concept_progress');
      const row = stmt.get() as { avg: number | null };
      return row.avg ?? 1;
    } catch (error) {
      throw new DatabaseQueryError('getAverageLevel', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Deletes a concept progress (for testing)
   */
  delete(conceptId: string): boolean {
    try {
      const stmt = this.db.prepare('DELETE FROM concept_progress WHERE concept_id = ?');
      const result = stmt.run(conceptId);
      return result.changes > 0;
    } catch (error) {
      throw new DatabaseQueryError('delete', error instanceof Error ? error : undefined);
    }
  }
}
