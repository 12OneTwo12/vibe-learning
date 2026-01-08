/**
 * SM-2 Spaced Repetition Algorithm Implementation
 *
 * The SM-2 algorithm is used by Anki and other spaced repetition systems.
 * It calculates optimal review intervals based on learning performance.
 *
 * Algorithm Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

import type { LearningResult, SM2Result } from '../types/index.js';
import { SM2_CONFIG } from './constants.js';
import { addDays } from './utils.js';

/**
 * Quality rating for SM-2 (0-5 scale)
 * 5 - perfect response
 * 4 - correct response after hesitation
 * 3 - correct response with serious difficulty
 * 2 - incorrect response but easy recall
 * 1 - incorrect response with serious difficulty
 * 0 - complete blackout
 */
export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Maps learning result to SM-2 quality score
 */
export function resultToQuality(result: LearningResult): SM2Quality {
  switch (result) {
    case 'correct':
      return SM2_CONFIG.QUALITY_SCORES.correct as SM2Quality;
    case 'partial':
      return SM2_CONFIG.QUALITY_SCORES.partial as SM2Quality;
    case 'incorrect':
      return SM2_CONFIG.QUALITY_SCORES.incorrect as SM2Quality;
    case 'skipped':
      return SM2_CONFIG.QUALITY_SCORES.skipped as SM2Quality;
  }
}

/**
 * Calculates new easiness factor based on quality
 *
 * EF' = EF + (0.1 - (5 - q) × (0.08 + (5 - q) × 0.02))
 *
 * Where:
 * - EF' is the new easiness factor
 * - EF is the current easiness factor
 * - q is the quality of the response (0-5)
 */
export function calculateEasinessFactor(currentEF: number, quality: SM2Quality): number {
  // For skipped items, don't modify EF
  if (quality === 0) {
    return currentEF;
  }

  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const newEF = currentEF + delta;

  // Enforce minimum EF
  return Math.max(SM2_CONFIG.MIN_EASINESS_FACTOR, newEF);
}

/**
 * Calculates the next review interval
 *
 * For quality >= 3 (correct):
 * - First review: I(1) = 1 day
 * - Second review: I(2) = 6 days
 * - Subsequent: I(n) = I(n-1) × EF
 *
 * For quality < 3 (incorrect):
 * - Reset to I(1) = 1 day
 */
export function calculateInterval(
  currentInterval: number,
  repetitionNumber: number,
  easinessFactor: number,
  quality: SM2Quality
): number {
  // For skipped, keep current interval
  if (quality === 0) {
    return currentInterval;
  }

  // If quality is below 3 (incorrect/serious difficulty), reset
  if (quality < 3) {
    return SM2_CONFIG.INITIAL_INTERVAL;
  }

  // First successful repetition
  if (repetitionNumber === 1) {
    return SM2_CONFIG.INITIAL_INTERVAL;
  }

  // Second successful repetition
  if (repetitionNumber === 2) {
    return SM2_CONFIG.SECOND_INTERVAL;
  }

  // Subsequent repetitions: I(n) = I(n-1) × EF
  return Math.round(currentInterval * easinessFactor);
}

/**
 * Determines if a quality score counts as a successful repetition
 */
export function isSuccessfulRepetition(quality: SM2Quality): boolean {
  return quality >= 3;
}

/**
 * SM-2 calculation input
 */
export interface SM2Input {
  /** Current easiness factor (default 2.5) */
  readonly currentEF: number;
  /** Current interval in days */
  readonly currentInterval: number;
  /** Number of successful repetitions (streak) */
  readonly repetitionNumber: number;
  /** Learning result */
  readonly result: LearningResult;
}

/**
 * Calculates the next SM-2 state
 */
export function calculateSM2(input: SM2Input): SM2Result {
  const quality = resultToQuality(input.result);

  // Calculate new easiness factor
  const newEF = calculateEasinessFactor(input.currentEF, quality);

  // Determine repetition number for interval calculation
  const effectiveRepNumber = isSuccessfulRepetition(quality)
    ? input.repetitionNumber + 1
    : 1; // Reset on failure

  // Calculate new interval
  const newInterval = calculateInterval(input.currentInterval, effectiveRepNumber, newEF, quality);

  // Calculate next review date
  const nextReview = addDays(new Date(), newInterval);

  return {
    easinessFactor: Number(newEF.toFixed(2)),
    intervalDays: newInterval,
    nextReview,
  };
}

/**
 * Creates initial SM-2 state for a new concept
 */
export function createInitialSM2State(): SM2Result {
  return {
    easinessFactor: SM2_CONFIG.DEFAULT_EASINESS_FACTOR,
    intervalDays: SM2_CONFIG.INITIAL_INTERVAL,
    nextReview: addDays(new Date(), SM2_CONFIG.INITIAL_INTERVAL),
  };
}

/**
 * Calculates days until next review
 */
export function daysUntilReview(nextReview: Date): number {
  const now = new Date();
  const diff = nextReview.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Checks if a concept is due for review
 */
export function isDueForReview(nextReview: Date): boolean {
  return daysUntilReview(nextReview) <= 0;
}

/**
 * Calculates days overdue (negative if not yet due)
 */
export function daysOverdue(nextReview: Date): number {
  return -daysUntilReview(nextReview);
}
