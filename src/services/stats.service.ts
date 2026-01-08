/**
 * Statistics Service
 *
 * Provides learning statistics and analytics.
 */

import type {
  TimePeriod,
  GetStatsResponse,
  ConceptStatsResponse,
  StatsSummary,
} from '../types/index.js';
import {
  ConceptProgressRepository,
  LearningRecordRepository,
} from '../db/index.js';
import { formatDateString, formatPeriodString, getPeriodStartDate, calculateRate } from '../core/utils.js';

/**
 * Service for calculating learning statistics
 */
export class StatsService {
  private readonly progressRepo: ConceptProgressRepository;
  private readonly recordRepo: LearningRecordRepository;

  constructor(progressRepo?: ConceptProgressRepository, recordRepo?: LearningRecordRepository) {
    this.progressRepo = progressRepo ?? new ConceptProgressRepository();
    this.recordRepo = recordRepo ?? new LearningRecordRepository();
  }

  /**
   * Gets comprehensive statistics for a time period
   */
  getStats(period: TimePeriod = 'month'): GetStatsResponse {
    const aggregates = this.recordRepo.getAggregateStatsByPeriod(period);
    const resultCounts = this.recordRepo.countByResult(period);
    const streakDays = this.recordRepo.getStreakDays();

    // Calculate summary
    const totalAttempts = aggregates.reduce((sum, a) => sum + a.totalAttempts, 0);
    const correctCount = resultCounts.correct ?? 0;
    const partialCount = resultCounts.partial ?? 0;
    const skippedCount = resultCounts.skipped ?? 0;
    const totalCorrect = correctCount + Math.floor(partialCount * 0.5); // Partial counts as half correct

    const summary: StatsSummary = {
      totalConcepts: aggregates.length,
      totalAttempts,
      correctRate: calculateRate(totalCorrect, totalAttempts - skippedCount),
      avgLevel: this.progressRepo.getAverageLevel(),
    };

    // Build per-concept stats
    const byConcept: ConceptStatsResponse[] = aggregates.map((agg) => {
      const progress = this.progressRepo.findById(agg.conceptId);
      const correctRate = calculateRate(agg.correctCount, agg.totalAttempts - agg.skippedCount);

      return {
        conceptId: agg.conceptId,
        currentLevel: progress?.currentLevel ?? 1,
        attempts: agg.totalAttempts,
        correctRate,
        lastSeen: formatDateString(agg.lastAttempt),
      };
    });

    // Sort by attempts descending
    byConcept.sort((a, b) => b.attempts - a.attempts);

    const startDate = getPeriodStartDate(period);
    return {
      period: formatPeriodString(period, startDate),
      summary,
      byConcept,
      streakDays,
    };
  }

  /**
   * Gets summary statistics only
   */
  getSummary(period: TimePeriod = 'month'): StatsSummary {
    const aggregates = this.recordRepo.getAggregateStatsByPeriod(period);
    const resultCounts = this.recordRepo.countByResult(period);

    const totalAttempts = aggregates.reduce((sum, a) => sum + a.totalAttempts, 0);
    const correctCount = resultCounts.correct ?? 0;
    const partialCount = resultCounts.partial ?? 0;
    const skippedCount = resultCounts.skipped ?? 0;
    const totalCorrect = correctCount + Math.floor(partialCount * 0.5);

    return {
      totalConcepts: aggregates.length,
      totalAttempts,
      correctRate: calculateRate(totalCorrect, totalAttempts - skippedCount),
      avgLevel: this.progressRepo.getAverageLevel(),
    };
  }

  /**
   * Gets the learning streak (consecutive days)
   */
  getStreak(): number {
    return this.recordRepo.getStreakDays();
  }

  /**
   * Gets concepts with the most attempts in a period
   */
  getMostPracticed(period: TimePeriod, limit = 5): readonly ConceptStatsResponse[] {
    const aggregates = this.recordRepo.getAggregateStatsByPeriod(period);

    return [...aggregates]
      .sort((a, b) => b.totalAttempts - a.totalAttempts)
      .slice(0, limit)
      .map((agg) => {
        const progress = this.progressRepo.findById(agg.conceptId);
        return {
          conceptId: agg.conceptId,
          currentLevel: progress?.currentLevel ?? 1,
          attempts: agg.totalAttempts,
          correctRate: calculateRate(agg.correctCount, agg.totalAttempts - agg.skippedCount),
          lastSeen: formatDateString(agg.lastAttempt),
        };
      });
  }

  /**
   * Gets concepts that need attention (low correct rate or stagnant level)
   */
  getWeakConcepts(period: TimePeriod, limit = 5): readonly ConceptStatsResponse[] {
    const aggregates = this.recordRepo.getAggregateStatsByPeriod(period);

    const mapped = [...aggregates]
      .filter((agg) => agg.totalAttempts >= 2) // Only concepts with enough data
      .map((agg) => {
        const progress = this.progressRepo.findById(agg.conceptId);
        const correctRate = calculateRate(agg.correctCount, agg.totalAttempts - agg.skippedCount);
        return {
          conceptId: agg.conceptId,
          currentLevel: progress?.currentLevel ?? 1,
          attempts: agg.totalAttempts,
          correctRate,
          lastSeen: formatDateString(agg.lastAttempt),
        };
      })
      .filter((stat) => stat.correctRate < 0.6); // Below 60% correct rate

    return mapped
      .sort((a, b) => a.correctRate - b.correctRate)
      .slice(0, limit);
  }

  /**
   * Gets concepts with highest mastery
   */
  getStrongConcepts(limit = 5): readonly ConceptStatsResponse[] {
    const allProgress = this.progressRepo.getAll();
    const aggregates = this.recordRepo.getAggregateStatsByPeriod('all');

    const statsMap = new Map(aggregates.map((a) => [a.conceptId, a]));

    return allProgress
      .filter((p) => p.currentLevel >= 3)
      .map((progress) => {
        const agg = statsMap.get(progress.conceptId);
        const correctRate = agg
          ? calculateRate(agg.correctCount, agg.totalAttempts - agg.skippedCount)
          : 0;

        return {
          conceptId: progress.conceptId,
          currentLevel: progress.currentLevel,
          attempts: agg?.totalAttempts ?? 0,
          correctRate,
          lastSeen: formatDateString(progress.createdAt),
        };
      })
      .sort((a, b) => b.currentLevel - a.currentLevel || b.correctRate - a.correctRate)
      .slice(0, limit);
  }
}
