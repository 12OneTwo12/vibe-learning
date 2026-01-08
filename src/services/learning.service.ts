/**
 * Learning Service
 *
 * Core service for managing learning progress, recording attempts,
 * and calculating level progression.
 */

import type {
  ConceptLevel,
  LearningResult,
  ConceptProgress,
  GetConceptLevelResponse,
  RecordLearningResponse,
  DueReview,
} from '../types/index.js';
import {
  ConceptProgressRepository,
  LearningRecordRepository,
  SessionStateRepository,
  UnknownUnknownsRepository,
  executeTransaction,
} from '../db/index.js';
import { calculateSM2, daysOverdue } from '../core/sm2.js';
import { LEVEL_CONFIG } from '../core/constants.js';
import { normalizeConceptId, formatDateString, clampLevel } from '../core/utils.js';

/**
 * Service for managing learning progress
 */
export class LearningService {
  private readonly progressRepo: ConceptProgressRepository;
  private readonly recordRepo: LearningRecordRepository;
  private readonly sessionRepo: SessionStateRepository;
  private readonly unknownsRepo: UnknownUnknownsRepository;

  constructor(
    progressRepo?: ConceptProgressRepository,
    recordRepo?: LearningRecordRepository,
    sessionRepo?: SessionStateRepository,
    unknownsRepo?: UnknownUnknownsRepository
  ) {
    this.progressRepo = progressRepo ?? new ConceptProgressRepository();
    this.recordRepo = recordRepo ?? new LearningRecordRepository();
    this.sessionRepo = sessionRepo ?? new SessionStateRepository();
    this.unknownsRepo = unknownsRepo ?? new UnknownUnknownsRepository();
  }

  /**
   * Gets the current level for a concept, creating if it doesn't exist
   */
  getConceptLevel(conceptId: string): GetConceptLevelResponse {
    const normalizedId = normalizeConceptId(conceptId);
    const progress = this.progressRepo.getOrCreate(normalizedId);

    // Get last seen date
    const records = this.recordRepo.getByConceptId(normalizedId, 1);
    const lastSeen = records.length > 0 && records[0] ? formatDateString(records[0].createdAt) : null;

    return {
      conceptId: normalizedId,
      currentLevel: progress.currentLevel,
      totalAttempts: progress.totalAttempts,
      lastSeen,
    };
  }

  /**
   * Records a learning attempt and updates progress
   */
  recordLearning(conceptId: string, level: ConceptLevel, result: LearningResult): RecordLearningResponse {
    const normalizedId = normalizeConceptId(conceptId);

    return executeTransaction(() => {
      // Ensure concept exists
      const currentProgress = this.progressRepo.getOrCreate(normalizedId);

      // Record the attempt
      this.recordRepo.create({
        conceptId: normalizedId,
        level,
        result,
      });

      // Handle session state for skips
      if (result === 'skipped') {
        const sessionState = this.sessionRepo.recordSkip();
        return {
          recorded: true,
          newLevel: currentProgress.currentLevel,
          nextReview: currentProgress.nextReview ? formatDateString(currentProgress.nextReview) : formatDateString(new Date()),
          message: 'Skipped. Will ask again later.',
          levelChanged: false,
          consecutiveSkips: sessionState.consecutiveSkips,
        };
      }

      // Reset skips on actual attempt
      this.sessionRepo.resetSkips();

      // Calculate new SM-2 values
      const sm2Result = calculateSM2({
        currentEF: currentProgress.easinessFactor,
        currentInterval: currentProgress.intervalDays,
        repetitionNumber: this.getSuccessfulRepetitions(normalizedId),
        result,
      });

      // Calculate new level
      const newLevel = this.calculateNewLevel(currentProgress, result);
      const levelChanged = newLevel !== currentProgress.currentLevel;

      // Update progress
      this.progressRepo.update(normalizedId, {
        currentLevel: newLevel,
        easinessFactor: sm2Result.easinessFactor,
        intervalDays: sm2Result.intervalDays,
        nextReview: sm2Result.nextReview,
        incrementAttempts: true,
        incrementCorrect: result === 'correct',
      });

      // Build response message
      const message = this.buildResultMessage(result, currentProgress.currentLevel, newLevel, sm2Result.intervalDays);

      // Auto-mark as explored if this concept was in unknown unknowns
      // This closes the loop: unknown unknown → learned → explored
      this.markAsExploredIfExists(normalizedId);

      return {
        recorded: true,
        newLevel,
        nextReview: formatDateString(sm2Result.nextReview),
        message,
        levelChanged,
        consecutiveSkips: 0,
      };
    });
  }

  /**
   * Gets concepts due for review
   */
  getDueReviews(limit = 5): readonly DueReview[] {
    const dueProgress = this.progressRepo.getDueForReview(limit);

    return dueProgress.map((progress) => {
      // Get last result
      const records = this.recordRepo.getByConceptId(progress.conceptId, 1);
      const lastResult: LearningResult = records.length > 0 && records[0] ? records[0].result : 'skipped';

      return {
        conceptId: progress.conceptId,
        currentLevel: progress.currentLevel,
        daysOverdue: progress.nextReview ? daysOverdue(progress.nextReview) : 0,
        lastResult,
      };
    });
  }

  /**
   * Gets concept progress by ID
   */
  getProgress(conceptId: string): ConceptProgress | null {
    return this.progressRepo.findById(normalizeConceptId(conceptId));
  }

  /**
   * Gets all concepts
   */
  getAllConcepts(): readonly ConceptProgress[] {
    return this.progressRepo.getAll();
  }

  /**
   * Gets the count of successful repetitions (streak) for SM-2
   */
  private getSuccessfulRepetitions(conceptId: string): number {
    const records = this.recordRepo.getByConceptId(conceptId, 10);
    let streak = 0;

    for (const record of records) {
      if (record.result === 'correct' || record.result === 'partial') {
        streak++;
      } else if (record.result === 'incorrect') {
        break;
      }
      // Skip 'skipped' results - don't break streak
    }

    return streak;
  }

  /**
   * Calculates new level based on result
   */
  private calculateNewLevel(currentProgress: ConceptProgress, result: LearningResult): ConceptLevel {
    const { currentLevel } = currentProgress;

    switch (result) {
      case 'correct': {
        // Level up after consecutive correct answers at current level
        const recentRecords = this.recordRepo.getByConceptId(currentProgress.conceptId, LEVEL_CONFIG.CORRECT_TO_LEVEL_UP);
        const recentCorrect = recentRecords.filter((r) => r.result === 'correct').length;

        if (recentCorrect >= LEVEL_CONFIG.CORRECT_TO_LEVEL_UP - 1 && currentLevel < LEVEL_CONFIG.MAX_LEVEL) {
          return clampLevel(currentLevel + 1);
        }
        return currentLevel;
      }

      case 'partial':
        // Partial doesn't change level
        return currentLevel;

      case 'incorrect': {
        // Immediate level down on incorrect answer (adaptive calibration)
        // This helps find the user's actual level quickly
        if (currentLevel > LEVEL_CONFIG.MIN_LEVEL) {
          return clampLevel(currentLevel - 1);
        }
        return currentLevel;
      }

      case 'skipped':
        return currentLevel;
    }
  }

  /**
   * Builds a human-readable result message
   */
  private buildResultMessage(
    result: LearningResult,
    previousLevel: ConceptLevel,
    newLevel: ConceptLevel,
    nextIntervalDays: number
  ): string {
    const levelChanged = newLevel !== previousLevel;

    switch (result) {
      case 'correct':
        if (levelChanged) {
          return `Correct! Reached Level ${newLevel}! Next review: ${nextIntervalDays} days`;
        }
        return `Correct! Next review: ${nextIntervalDays} days`;

      case 'partial':
        return `Partial! A bit more practice and you'll master it. Next review: ${nextIntervalDays} days`;

      case 'incorrect':
        if (levelChanged) {
          return `Let's strengthen the basics! Found your level: Level ${newLevel}. Next review: ${nextIntervalDays} days`;
        }
        return `Let's review the fundamentals. Next review: ${nextIntervalDays} days`;

      case 'skipped':
        return 'Skipped. Will ask again later.';
    }
  }

  /**
   * Marks a concept as explored in unknown unknowns if it exists
   * This is called automatically after learning to close the loop:
   * unknown unknown → user learns about it → mark as explored
   */
  private markAsExploredIfExists(conceptId: string): void {
    try {
      const unknown = this.unknownsRepo.findByConceptId(conceptId);
      if (unknown && !unknown.explored) {
        this.unknownsRepo.markExplored(conceptId);
      }
    } catch {
      // Silently ignore errors - this is a best-effort cleanup
    }
  }
}
