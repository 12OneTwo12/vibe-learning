/**
 * LearningRecord Repository
 *
 * Data access layer for learning attempt records.
 */

import type Database from 'better-sqlite3';
import type { LearningRecord, LearningRecordInput, LearningResult, ConceptLevel, TimePeriod } from '../../types/index.js';
import { getDatabase } from '../connection.js';
import { DatabaseQueryError } from '../../core/errors.js';
import { getPeriodStartDate, formatDateString } from '../../core/utils.js';

/**
 * Raw database row type for learning_records table
 */
interface LearningRecordRow {
  id: number;
  concept_id: string;
  level: number;
  result: string;
  created_at: string;
}

/**
 * Aggregated statistics per concept
 */
export interface ConceptAggregateStats {
  readonly conceptId: string;
  readonly totalAttempts: number;
  readonly correctCount: number;
  readonly partialCount: number;
  readonly incorrectCount: number;
  readonly skippedCount: number;
  readonly lastAttempt: Date;
}

/**
 * Converts a database row to domain model
 */
function rowToModel(row: LearningRecordRow): LearningRecord {
  return {
    id: row.id,
    conceptId: row.concept_id,
    level: row.level as ConceptLevel,
    result: row.result as LearningResult,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Repository for learning record operations
 */
export class LearningRecordRepository {
  private readonly db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db ?? getDatabase();
  }

  /**
   * Creates a new learning record
   */
  create(input: LearningRecordInput): LearningRecord {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO learning_records (concept_id, level, result)
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(input.conceptId, input.level, input.result);

      return this.findById(Number(result.lastInsertRowid)) as LearningRecord;
    } catch (error) {
      throw new DatabaseQueryError('create', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Finds a learning record by ID
   */
  findById(id: number): LearningRecord | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM learning_records WHERE id = ?');
      const row = stmt.get(id) as LearningRecordRow | undefined;
      return row ? rowToModel(row) : null;
    } catch (error) {
      throw new DatabaseQueryError('findById', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Gets records for a concept
   */
  getByConceptId(conceptId: string, limit?: number): readonly LearningRecord[] {
    try {
      let sql = `
        SELECT * FROM learning_records
        WHERE concept_id = ?
        ORDER BY created_at DESC
      `;
      if (limit) {
        sql += ` LIMIT ${limit}`;
      }
      const stmt = this.db.prepare(sql);
      const rows = stmt.all(conceptId) as LearningRecordRow[];
      return rows.map(rowToModel);
    } catch (error) {
      throw new DatabaseQueryError('getByConceptId', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Gets records within a time period
   */
  getByPeriod(period: TimePeriod): readonly LearningRecord[] {
    try {
      const startDate = getPeriodStartDate(period);
      const stmt = this.db.prepare(`
        SELECT * FROM learning_records
        WHERE created_at >= ?
        ORDER BY created_at DESC
      `);
      const rows = stmt.all(startDate.toISOString()) as LearningRecordRow[];
      return rows.map(rowToModel);
    } catch (error) {
      throw new DatabaseQueryError('getByPeriod', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Gets the last N records
   */
  getRecent(limit = 10): readonly LearningRecord[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM learning_records
        ORDER BY created_at DESC
        LIMIT ?
      `);
      const rows = stmt.all(limit) as LearningRecordRow[];
      return rows.map(rowToModel);
    } catch (error) {
      throw new DatabaseQueryError('getRecent', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Counts records by result type within a period
   */
  countByResult(period: TimePeriod): Record<LearningResult, number> {
    try {
      const startDate = getPeriodStartDate(period);
      const stmt = this.db.prepare(`
        SELECT result, COUNT(*) as count
        FROM learning_records
        WHERE created_at >= ?
        GROUP BY result
      `);
      const rows = stmt.all(startDate.toISOString()) as { result: string; count: number }[];

      const result: Record<LearningResult, number> = {
        correct: 0,
        partial: 0,
        incorrect: 0,
        skipped: 0,
      };

      for (const row of rows) {
        result[row.result as LearningResult] = row.count;
      }

      return result;
    } catch (error) {
      throw new DatabaseQueryError('countByResult', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Gets aggregate statistics per concept for a period
   */
  getAggregateStatsByPeriod(period: TimePeriod): readonly ConceptAggregateStats[] {
    try {
      const startDate = getPeriodStartDate(period);
      const stmt = this.db.prepare(`
        SELECT
          concept_id,
          COUNT(*) as total_attempts,
          SUM(CASE WHEN result = 'correct' THEN 1 ELSE 0 END) as correct_count,
          SUM(CASE WHEN result = 'partial' THEN 1 ELSE 0 END) as partial_count,
          SUM(CASE WHEN result = 'incorrect' THEN 1 ELSE 0 END) as incorrect_count,
          SUM(CASE WHEN result = 'skipped' THEN 1 ELSE 0 END) as skipped_count,
          MAX(created_at) as last_attempt
        FROM learning_records
        WHERE created_at >= ?
        GROUP BY concept_id
        ORDER BY total_attempts DESC
      `);

      const rows = stmt.all(startDate.toISOString()) as {
        concept_id: string;
        total_attempts: number;
        correct_count: number;
        partial_count: number;
        incorrect_count: number;
        skipped_count: number;
        last_attempt: string;
      }[];

      return rows.map((row) => ({
        conceptId: row.concept_id,
        totalAttempts: row.total_attempts,
        correctCount: row.correct_count,
        partialCount: row.partial_count,
        incorrectCount: row.incorrect_count,
        skippedCount: row.skipped_count,
        lastAttempt: new Date(row.last_attempt),
      }));
    } catch (error) {
      throw new DatabaseQueryError('getAggregateStatsByPeriod', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Gets unique concepts touched in a period
   */
  getUniqueConcepts(period: TimePeriod): readonly string[] {
    try {
      const startDate = getPeriodStartDate(period);
      const stmt = this.db.prepare(`
        SELECT DISTINCT concept_id
        FROM learning_records
        WHERE created_at >= ?
      `);
      const rows = stmt.all(startDate.toISOString()) as { concept_id: string }[];
      return rows.map((row) => row.concept_id);
    } catch (error) {
      throw new DatabaseQueryError('getUniqueConcepts', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Gets concepts with most skips in a period
   */
  getMostSkipped(period: TimePeriod, limit = 5): readonly { conceptId: string; skipCount: number; lastSkipped: Date }[] {
    try {
      const startDate = getPeriodStartDate(period);
      const stmt = this.db.prepare(`
        SELECT
          concept_id,
          COUNT(*) as skip_count,
          MAX(created_at) as last_skipped
        FROM learning_records
        WHERE created_at >= ? AND result = 'skipped'
        GROUP BY concept_id
        ORDER BY skip_count DESC
        LIMIT ?
      `);

      const rows = stmt.all(startDate.toISOString(), limit) as {
        concept_id: string;
        skip_count: number;
        last_skipped: string;
      }[];

      return rows.map((row) => ({
        conceptId: row.concept_id,
        skipCount: row.skip_count,
        lastSkipped: new Date(row.last_skipped),
      }));
    } catch (error) {
      throw new DatabaseQueryError('getMostSkipped', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Calculates streak days (consecutive days with learning activity)
   */
  getStreakDays(): number {
    try {
      const stmt = this.db.prepare(`
        SELECT DISTINCT date(created_at) as learning_date
        FROM learning_records
        WHERE result != 'skipped'
        ORDER BY learning_date DESC
      `);
      const rows = stmt.all() as { learning_date: string }[];

      if (rows.length === 0) return 0;

      let streak = 0;
      const today = formatDateString(new Date());
      let expectedDate = today;

      for (const row of rows) {
        if (row.learning_date === expectedDate) {
          streak++;
          const date = new Date(expectedDate);
          date.setDate(date.getDate() - 1);
          expectedDate = formatDateString(date);
        } else if (row.learning_date < expectedDate) {
          break;
        }
      }

      return streak;
    } catch (error) {
      throw new DatabaseQueryError('getStreakDays', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Counts total records
   */
  count(): number {
    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM learning_records');
      const row = stmt.get() as { count: number };
      return row.count;
    } catch (error) {
      throw new DatabaseQueryError('count', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Deletes records for a concept (for testing)
   */
  deleteByConceptId(conceptId: string): number {
    try {
      const stmt = this.db.prepare('DELETE FROM learning_records WHERE concept_id = ?');
      const result = stmt.run(conceptId);
      return result.changes;
    } catch (error) {
      throw new DatabaseQueryError('deleteByConceptId', error instanceof Error ? error : undefined);
    }
  }
}
