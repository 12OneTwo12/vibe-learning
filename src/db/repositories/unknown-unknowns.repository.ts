/**
 * UnknownUnknowns Repository
 *
 * Data access layer for tracking concepts users encountered but haven't explored.
 */

import type Database from 'better-sqlite3';
import type { UnknownUnknown, UnknownUnknownInput, TimePeriod, UnknownPriority } from '../../types/index.js';
import { getDatabase } from '../connection.js';
import { DatabaseQueryError } from '../../core/errors.js';
import { getPeriodStartDate } from '../../core/utils.js';
import { UNKNOWN_PRIORITY_CONFIG } from '../../core/constants.js';

/**
 * Raw database row type for unknown_unknowns table
 */
interface UnknownUnknownRow {
  id: number;
  concept_id: string;
  related_to: string;
  appearances: number;
  explored: number;
  context: string | null;
  why_important: string | null;
  first_seen: string;
  explored_at: string | null;
}

/**
 * Converts a database row to domain model
 */
function rowToModel(row: UnknownUnknownRow): UnknownUnknown {
  return {
    id: row.id,
    conceptId: row.concept_id,
    relatedTo: row.related_to,
    appearances: row.appearances,
    explored: row.explored === 1,
    context: row.context ?? '',
    whyImportant: row.why_important ?? '',
    firstSeen: new Date(row.first_seen),
    exploredAt: row.explored_at ? new Date(row.explored_at) : null,
  };
}

/**
 * Calculates priority based on appearances
 */
function calculatePriority(appearances: number): UnknownPriority {
  if (appearances >= UNKNOWN_PRIORITY_CONFIG.HIGH_THRESHOLD) {
    return 'high';
  }
  if (appearances >= UNKNOWN_PRIORITY_CONFIG.MEDIUM_THRESHOLD) {
    return 'medium';
  }
  return 'low';
}

/**
 * Repository for unknown unknowns operations
 */
export class UnknownUnknownsRepository {
  private readonly db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db ?? getDatabase();
  }

  /**
   * Records a new unknown unknown or increments appearances
   */
  recordOrIncrement(input: UnknownUnknownInput): UnknownUnknown {
    try {
      // Check if already exists
      const existing = this.findByConceptId(input.conceptId);

      if (existing) {
        // Increment appearances
        const stmt = this.db.prepare(`
          UPDATE unknown_unknowns
          SET appearances = appearances + 1,
              context = COALESCE(?, context),
              why_important = COALESCE(?, why_important)
          WHERE concept_id = ?
        `);
        stmt.run(input.context || null, input.whyImportant || null, input.conceptId);
        return this.findByConceptId(input.conceptId) as UnknownUnknown;
      }

      // Create new
      const stmt = this.db.prepare(`
        INSERT INTO unknown_unknowns (concept_id, related_to, context, why_important)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(input.conceptId, input.relatedTo, input.context || null, input.whyImportant || null);

      return this.findByConceptId(input.conceptId) as UnknownUnknown;
    } catch (error) {
      throw new DatabaseQueryError('recordOrIncrement', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Finds an unknown unknown by concept ID
   */
  findByConceptId(conceptId: string): UnknownUnknown | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM unknown_unknowns WHERE concept_id = ?');
      const row = stmt.get(conceptId) as UnknownUnknownRow | undefined;
      return row ? rowToModel(row) : null;
    } catch (error) {
      throw new DatabaseQueryError('findByConceptId', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Finds unknown unknowns by ID
   */
  findById(id: number): UnknownUnknown | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM unknown_unknowns WHERE id = ?');
      const row = stmt.get(id) as UnknownUnknownRow | undefined;
      return row ? rowToModel(row) : null;
    } catch (error) {
      throw new DatabaseQueryError('findById', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Marks an unknown unknown as explored
   */
  markExplored(conceptId: string): UnknownUnknown | null {
    try {
      const stmt = this.db.prepare(`
        UPDATE unknown_unknowns
        SET explored = 1, explored_at = datetime('now')
        WHERE concept_id = ?
      `);
      stmt.run(conceptId);
      return this.findByConceptId(conceptId);
    } catch (error) {
      throw new DatabaseQueryError('markExplored', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Gets unexplored unknown unknowns within a period
   */
  getUnexplored(period: TimePeriod, limit = 10): readonly (UnknownUnknown & { priority: UnknownPriority })[] {
    try {
      const startDate = getPeriodStartDate(period);
      const stmt = this.db.prepare(`
        SELECT * FROM unknown_unknowns
        WHERE explored = 0 AND first_seen >= ?
        ORDER BY appearances DESC, first_seen DESC
        LIMIT ?
      `);
      const rows = stmt.all(startDate.toISOString(), limit) as UnknownUnknownRow[];
      return rows.map((row) => ({
        ...rowToModel(row),
        priority: calculatePriority(row.appearances),
      }));
    } catch (error) {
      throw new DatabaseQueryError('getUnexplored', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Gets unknown unknowns related to a concept
   */
  getByRelatedTo(relatedTo: string): readonly UnknownUnknown[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM unknown_unknowns
        WHERE related_to = ?
        ORDER BY appearances DESC
      `);
      const rows = stmt.all(relatedTo) as UnknownUnknownRow[];
      return rows.map(rowToModel);
    } catch (error) {
      throw new DatabaseQueryError('getByRelatedTo', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Counts unexplored unknown unknowns
   */
  countUnexplored(): number {
    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM unknown_unknowns WHERE explored = 0');
      const row = stmt.get() as { count: number };
      return row.count;
    } catch (error) {
      throw new DatabaseQueryError('countUnexplored', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Counts explored within a period
   */
  countExploredInPeriod(period: TimePeriod): number {
    try {
      const startDate = getPeriodStartDate(period);
      const stmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM unknown_unknowns
        WHERE explored = 1 AND explored_at >= ?
      `);
      const row = stmt.get(startDate.toISOString()) as { count: number };
      return row.count;
    } catch (error) {
      throw new DatabaseQueryError('countExploredInPeriod', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Gets high priority unknown unknowns
   */
  getHighPriority(limit = 5): readonly UnknownUnknown[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM unknown_unknowns
        WHERE explored = 0 AND appearances >= ?
        ORDER BY appearances DESC
        LIMIT ?
      `);
      const rows = stmt.all(UNKNOWN_PRIORITY_CONFIG.HIGH_THRESHOLD, limit) as UnknownUnknownRow[];
      return rows.map(rowToModel);
    } catch (error) {
      throw new DatabaseQueryError('getHighPriority', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Deletes an unknown unknown (for testing)
   */
  delete(conceptId: string): boolean {
    try {
      const stmt = this.db.prepare('DELETE FROM unknown_unknowns WHERE concept_id = ?');
      const result = stmt.run(conceptId);
      return result.changes > 0;
    } catch (error) {
      throw new DatabaseQueryError('delete', error instanceof Error ? error : undefined);
    }
  }
}
