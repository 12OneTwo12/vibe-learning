/**
 * Unknown Unknowns Service
 *
 * Tracks concepts users encountered but haven't explored.
 * Helps discover "what you don't know you don't know."
 */

import type {
  TimePeriod,
  GetUnknownUnknownsResponse,
  UnknownUnknownItem,
  RecordUnknownUnknownResponse,
  MarkExploredResponse,
} from '../types/index.js';
import { UnknownUnknownsRepository } from '../db/index.js';
import { UNKNOWN_PRIORITY_CONFIG } from '../core/constants.js';
import { formatPeriodString, getPeriodStartDate, normalizeConceptId } from '../core/utils.js';

/**
 * Service for managing unknown unknowns
 */
export class UnknownUnknownsService {
  private readonly unknownsRepo: UnknownUnknownsRepository;

  constructor(unknownsRepo?: UnknownUnknownsRepository) {
    this.unknownsRepo = unknownsRepo ?? new UnknownUnknownsRepository();
  }

  /**
   * Gets unknown unknowns for a time period
   */
  getUnknownUnknowns(period: TimePeriod = 'month', limit = 10): GetUnknownUnknownsResponse {
    const startDate = getPeriodStartDate(period);
    const unknowns = this.unknownsRepo.getUnexplored(period, limit);
    const exploredCount = this.unknownsRepo.countExploredInPeriod(period);
    const totalUnexplored = this.unknownsRepo.countUnexplored();

    const items: UnknownUnknownItem[] = unknowns.map((u) => ({
      conceptId: u.conceptId,
      relatedTo: u.relatedTo,
      appearances: u.appearances,
      explored: u.explored,
      priority: u.priority,
      context: u.context,
      whyImportant: u.whyImportant,
    }));

    return {
      period: formatPeriodString(period, startDate),
      unknowns: items,
      totalCount: totalUnexplored,
      exploredThisPeriod: exploredCount,
    };
  }

  /**
   * Records a new unknown unknown or increments appearances
   */
  recordUnknownUnknown(
    conceptId: string,
    relatedTo: string,
    context: string,
    whyImportant: string
  ): RecordUnknownUnknownResponse {
    const normalizedConceptId = normalizeConceptId(conceptId);
    const normalizedRelatedTo = normalizeConceptId(relatedTo);

    const existing = this.unknownsRepo.findByConceptId(normalizedConceptId);
    const isNew = !existing;

    const result = this.unknownsRepo.recordOrIncrement({
      conceptId: normalizedConceptId,
      relatedTo: normalizedRelatedTo,
      context,
      whyImportant,
    });

    return {
      recorded: true,
      conceptId: normalizedConceptId,
      isNew,
      appearances: result.appearances,
    };
  }

  /**
   * Marks an unknown unknown as explored
   */
  markExplored(conceptId: string): MarkExploredResponse {
    const normalizedId = normalizeConceptId(conceptId);
    const result = this.unknownsRepo.markExplored(normalizedId);

    if (!result) {
      return {
        updated: false,
        conceptId: normalizedId,
        message: `${normalizedId} not found.`,
      };
    }

    return {
      updated: true,
      conceptId: normalizedId,
      message: `Marked ${normalizedId} as explored!`,
    };
  }

  /**
   * Gets high priority unknown unknowns
   */
  getHighPriority(limit = 5): readonly UnknownUnknownItem[] {
    const unknowns = this.unknownsRepo.getHighPriority(limit);

    return unknowns.map((u) => ({
      conceptId: u.conceptId,
      relatedTo: u.relatedTo,
      appearances: u.appearances,
      explored: u.explored,
      priority: 'high' as const,
      context: u.context,
      whyImportant: u.whyImportant,
    }));
  }

  /**
   * Gets unknown unknowns related to a specific concept
   */
  getRelatedUnknowns(relatedTo: string): readonly UnknownUnknownItem[] {
    const normalizedId = normalizeConceptId(relatedTo);
    const unknowns = this.unknownsRepo.getByRelatedTo(normalizedId);

    return unknowns.map((u) => {
      let priority: 'high' | 'medium' | 'low' = 'low';
      if (u.appearances >= UNKNOWN_PRIORITY_CONFIG.HIGH_THRESHOLD) {
        priority = 'high';
      } else if (u.appearances >= UNKNOWN_PRIORITY_CONFIG.MEDIUM_THRESHOLD) {
        priority = 'medium';
      }

      return {
        conceptId: u.conceptId,
        relatedTo: u.relatedTo,
        appearances: u.appearances,
        explored: u.explored,
        priority,
        context: u.context,
        whyImportant: u.whyImportant,
      };
    });
  }

  /**
   * Gets total count of unexplored items
   */
  getUnexploredCount(): number {
    return this.unknownsRepo.countUnexplored();
  }
}
