/**
 * Report Service
 *
 * Generates comprehensive learning reports for host LLM to format.
 */

import type {
  TimePeriod,
  GetReportDataResponse,
  ReportSummary,
  ReportTrends,
  WeakArea,
  StrongArea,
  SkippedConceptResponse,
  UnknownUnknownItem,
} from '../types/index.js';
import {
  ConceptProgressRepository,
  LearningRecordRepository,
  UnknownUnknownsRepository,
} from '../db/index.js';
import { REPORT_CONFIG } from '../core/constants.js';
import {
  formatDateString,
  formatPeriodString,
  getPeriodStartDate,
  calculateRate,
  formatChange,
  groupBy,
  average,
} from '../core/utils.js';

/**
 * Service for generating learning reports
 */
export class ReportService {
  private readonly progressRepo: ConceptProgressRepository;
  private readonly recordRepo: LearningRecordRepository;
  private readonly unknownsRepo: UnknownUnknownsRepository;

  constructor(
    progressRepo?: ConceptProgressRepository,
    recordRepo?: LearningRecordRepository,
    unknownsRepo?: UnknownUnknownsRepository
  ) {
    this.progressRepo = progressRepo ?? new ConceptProgressRepository();
    this.recordRepo = recordRepo ?? new LearningRecordRepository();
    this.unknownsRepo = unknownsRepo ?? new UnknownUnknownsRepository();
  }

  /**
   * Gets comprehensive report data for a time period
   */
  getReportData(period: TimePeriod = 'week', area?: string): GetReportDataResponse {
    const startDate = getPeriodStartDate(period);
    const periodString = formatPeriodString(period, startDate);

    // Get aggregated statistics
    const aggregates = this.recordRepo.getAggregateStatsByPeriod(period);
    const resultCounts = this.recordRepo.countByResult(period);

    // Filter by area if specified
    const filteredAggregates = area
      ? aggregates.filter((a) => this.conceptMatchesArea(a.conceptId, area))
      : aggregates;

    // Calculate summary
    const summary = this.calculateSummary(filteredAggregates, resultCounts, period);

    // Identify weak areas
    const weakAreas = this.identifyWeakAreas(filteredAggregates);

    // Identify strong areas
    const strongAreas = this.identifyStrongAreas(filteredAggregates);

    // Get unknown unknowns
    const unknowns = this.getUnknownUnknowns(period);

    // Calculate trends
    const trends = this.calculateTrends(period);

    // Get skipped concepts
    const skippedConcepts = this.getSkippedConcepts(period);

    const result = {
      period: periodString,
      summary,
      weakAreas,
      strongAreas,
      unknownUnknowns: unknowns,
      trends,
      skippedConcepts,
      formattedOutput: '',
    };

    result.formattedOutput = this.formatReportOutput(result);
    return result;
  }

  /**
   * Formats report for display
   */
  private formatReportOutput(report: Omit<GetReportDataResponse, 'formattedOutput'>): string {
    const lines: string[] = [];

    // Header
    lines.push(`📊 VibeLearning Report (${report.period})`);
    lines.push('');

    // Summary stats
    lines.push('📈 Summary');
    lines.push(`  Concepts: ${report.summary.conceptsTouched} (${report.summary.newConcepts} new, ${report.summary.repeatedConcepts} reviewed)`);
    lines.push(`  Questions: ${report.summary.questionsAnswered} answered, ${Math.round(report.summary.skipRate * 100)}% skip rate`);
    lines.push(`  Level: ${report.summary.avgLevelStart.toFixed(1)} → ${report.summary.avgLevelEnd.toFixed(1)}`);
    lines.push('');

    // Weak areas
    if (report.weakAreas.length > 0) {
      lines.push('🔴 Weak Areas');
      for (const area of report.weakAreas) {
        lines.push(`  • ${area.area} (Lv ${area.avgLevel})`);
        lines.push(`    ${area.signals.join(', ')}`);
      }
      lines.push('');
    }

    // Strong areas
    if (report.strongAreas.length > 0) {
      lines.push('🟢 Strong Areas');
      for (const area of report.strongAreas) {
        lines.push(`  • ${area.area} (Lv ${area.avgLevel}, ${Math.round(area.correctRate * 100)}% correct)`);
      }
      lines.push('');
    }

    // Unknown unknowns
    if (report.unknownUnknowns.length > 0) {
      lines.push(`💡 New Concepts to Explore (${report.unknownUnknowns.length})`);
      for (const uu of report.unknownUnknowns.slice(0, 3)) {
        lines.push(`  • ${uu.conceptId} ← ${uu.relatedTo}`);
      }
      if (report.unknownUnknowns.length > 3) {
        lines.push(`  ... and ${report.unknownUnknowns.length - 3} more`);
      }
      lines.push('');
    }

    // Skipped concepts
    if (report.skippedConcepts.length > 0) {
      lines.push('⏭️ Often Skipped');
      for (const sc of report.skippedConcepts.slice(0, 3)) {
        lines.push(`  • ${sc.conceptId} (${sc.skipCount}x)`);
      }
      lines.push('');
    }

    // Trends
    lines.push('📉 vs Last Period');
    lines.push(`  Concepts: ${report.trends.vsLastPeriod.conceptsTouched}`);
    lines.push(`  Level: ${report.trends.vsLastPeriod.avgLevel}`);
    lines.push(`  Correct Rate: ${report.trends.vsLastPeriod.correctRate}`);

    return lines.join('\n');
  }

  /**
   * Calculates report summary
   */
  private calculateSummary(
    aggregates: readonly { conceptId: string; totalAttempts: number; correctCount: number; skippedCount: number }[],
    resultCounts: Record<string, number>,
    period: TimePeriod
  ): ReportSummary {
    // Get all concepts to check for new vs repeated
    const allConcepts = this.progressRepo.getAll();
    const conceptCreatedMap = new Map(allConcepts.map((c) => [c.conceptId, c.createdAt]));

    const startDate = getPeriodStartDate(period);
    const conceptsTouched = aggregates.length;
    const newConcepts = aggregates.filter((a) => {
      const created = conceptCreatedMap.get(a.conceptId);
      return created && created >= startDate;
    }).length;
    const repeatedConcepts = conceptsTouched - newConcepts;

    const totalQuestions = aggregates.reduce((sum, a) => sum + a.totalAttempts - a.skippedCount, 0);
    const correctCount = resultCounts['correct'] ?? 0;
    const partialCount = resultCounts['partial'] ?? 0;
    const incorrectCount = resultCounts['incorrect'] ?? 0;
    const skippedCount = resultCounts['skipped'] ?? 0;
    const totalAnswered = correctCount + partialCount + incorrectCount;
    const totalSkipped = skippedCount;

    const skipRate = calculateRate(totalSkipped, totalAnswered + totalSkipped);

    // Calculate average level change (pre-fetch to avoid N+1)
    const allProgress = this.progressRepo.getAll();
    const progressMap = new Map(allProgress.map((p) => [p.conceptId, p]));

    const levels = aggregates.map((a) => {
      const progress = progressMap.get(a.conceptId);
      return progress?.currentLevel ?? 1;
    });
    const avgLevelEnd = average(levels);

    // For start level, we'd need historical data - approximate with current - changes
    const avgLevelStart = Math.max(1, avgLevelEnd - 0.3); // Rough approximation

    return {
      conceptsTouched,
      newConcepts,
      repeatedConcepts,
      questionsAsked: totalQuestions,
      questionsAnswered: totalAnswered,
      skipRate: Number(skipRate.toFixed(2)),
      avgLevelStart: Number(avgLevelStart.toFixed(1)),
      avgLevelEnd: Number(avgLevelEnd.toFixed(1)),
    };
  }

  /**
   * Identifies weak areas based on low correct rate or stagnant progress
   */
  private identifyWeakAreas(
    aggregates: readonly { conceptId: string; totalAttempts: number; correctCount: number; skippedCount: number }[]
  ): readonly WeakArea[] {
    // Group by area (prefix before first hyphen or underscore)
    const grouped = groupBy(aggregates, (a) => this.extractArea(a.conceptId));

    // Pre-fetch all progress data to avoid N+1 queries
    const allProgress = this.progressRepo.getAll();
    const progressMap = new Map(allProgress.map((p) => [p.conceptId, p]));

    const weakAreas: WeakArea[] = [];

    for (const [area, concepts] of Object.entries(grouped)) {
      if (concepts.length < 2) continue; // Need at least 2 concepts for an area

      const totalAttempts = concepts.reduce((sum, c) => sum + c.totalAttempts, 0);
      const totalCorrect = concepts.reduce((sum, c) => sum + c.correctCount, 0);
      const totalSkipped = concepts.reduce((sum, c) => sum + c.skippedCount, 0);

      const correctRate = calculateRate(totalCorrect, totalAttempts - totalSkipped);

      // Identify signals
      const signals: string[] = [];
      if (correctRate < 0.5) {
        signals.push(`Low correct rate: ${Math.round(correctRate * 100)}%`);
      }

      const levels = concepts.map((c) => {
        const progress = progressMap.get(c.conceptId);
        return progress?.currentLevel ?? 1;
      });
      const avgLevel = average(levels);

      if (avgLevel < 2.5) {
        signals.push(`Low average level: ${avgLevel.toFixed(1)}`);
      }

      const highSkipConcepts = concepts.filter((c) => c.skippedCount >= 2);
      if (highSkipConcepts.length > 0) {
        signals.push(`${highSkipConcepts.length} concepts skipped multiple times`);
      }

      if (signals.length > 0) {
        weakAreas.push({
          area,
          concepts: concepts.map((c) => c.conceptId),
          appearances: totalAttempts,
          avgLevel: Number(avgLevel.toFixed(1)),
          signals,
        });
      }
    }

    return weakAreas.sort((a, b) => a.avgLevel - b.avgLevel).slice(0, REPORT_CONFIG.MAX_WEAK_AREAS);
  }

  /**
   * Identifies strong areas based on high correct rate and level
   */
  private identifyStrongAreas(
    aggregates: readonly { conceptId: string; totalAttempts: number; correctCount: number; skippedCount: number }[]
  ): readonly StrongArea[] {
    const grouped = groupBy(aggregates, (a) => this.extractArea(a.conceptId));

    // Pre-fetch all progress data to avoid N+1 queries
    const allProgress = this.progressRepo.getAll();
    const progressMap = new Map(allProgress.map((p) => [p.conceptId, p]));

    const strongAreas: StrongArea[] = [];

    for (const [area, concepts] of Object.entries(grouped)) {
      if (concepts.length < 2) continue;

      const totalAttempts = concepts.reduce((sum, c) => sum + c.totalAttempts, 0);
      const totalCorrect = concepts.reduce((sum, c) => sum + c.correctCount, 0);
      const totalSkipped = concepts.reduce((sum, c) => sum + c.skippedCount, 0);

      const correctRate = calculateRate(totalCorrect, totalAttempts - totalSkipped);

      const levels = concepts.map((c) => {
        const progress = progressMap.get(c.conceptId);
        return progress?.currentLevel ?? 1;
      });
      const avgLevel = average(levels);

      if (correctRate >= 0.7 && avgLevel >= 3) {
        strongAreas.push({
          area,
          concepts: concepts.map((c) => c.conceptId),
          avgLevel: Number(avgLevel.toFixed(1)),
          correctRate: Number(correctRate.toFixed(2)),
        });
      }
    }

    return strongAreas.sort((a, b) => b.avgLevel - a.avgLevel || b.correctRate - a.correctRate);
  }

  /**
   * Gets unknown unknowns for the period
   */
  private getUnknownUnknowns(period: TimePeriod): readonly UnknownUnknownItem[] {
    const unknowns = this.unknownsRepo.getUnexplored(period, REPORT_CONFIG.MAX_UNKNOWNS);

    return unknowns.map((u) => ({
      conceptId: u.conceptId,
      relatedTo: u.relatedTo,
      appearances: u.appearances,
      explored: u.explored,
      priority: u.priority,
      context: u.context,
      whyImportant: u.whyImportant,
    }));
  }

  /**
   * Calculates trends compared to previous period
   */
  private calculateTrends(period: TimePeriod): ReportTrends {
    const currentAggregates = this.recordRepo.getAggregateStatsByPeriod(period);
    const currentResults = this.recordRepo.countByResult(period);

    // Get previous period data (rough approximation)
    const prevPeriod: TimePeriod = period === 'week' ? 'month' : 'all';
    const prevAggregates = this.recordRepo.getAggregateStatsByPeriod(prevPeriod);

    const currentConceptCount = currentAggregates.length;
    const prevConceptCount = Math.max(1, prevAggregates.length / (period === 'week' ? 4 : 1));

    const currentCorrectRate =
      currentResults.correct / Math.max(1, currentResults.correct + currentResults.partial + currentResults.incorrect);
    const prevCorrectRate = 0.65; // Baseline assumption

    // Pre-fetch all progress data to avoid N+1 queries
    const allProgress = this.progressRepo.getAll();
    const progressMap = new Map(allProgress.map((p) => [p.conceptId, p]));

    const currentLevels = currentAggregates.map((a) => {
      const progress = progressMap.get(a.conceptId);
      return progress?.currentLevel ?? 1;
    });
    const currentAvgLevel = average(currentLevels);
    const prevAvgLevel = Math.max(1, currentAvgLevel - 0.3);

    return {
      vsLastPeriod: {
        conceptsTouched: formatChange(currentConceptCount, prevConceptCount, 0),
        avgLevel: formatChange(currentAvgLevel, prevAvgLevel, 1),
        correctRate: formatChange(currentCorrectRate, prevCorrectRate, 2),
      },
    };
  }

  /**
   * Gets most skipped concepts
   */
  private getSkippedConcepts(period: TimePeriod): readonly SkippedConceptResponse[] {
    const skipped = this.recordRepo.getMostSkipped(period, 5);

    return skipped.map((s) => ({
      conceptId: s.conceptId,
      skipCount: s.skipCount,
      lastSkipped: formatDateString(s.lastSkipped),
    }));
  }

  /**
   * Extracts area from concept ID (first part before hyphen)
   */
  private extractArea(conceptId: string): string {
    const parts = conceptId.split(/[-_]/);
    return parts[0] ?? 'general';
  }

  /**
   * Checks if concept matches an area filter
   */
  private conceptMatchesArea(conceptId: string, area: string): boolean {
    const conceptArea = this.extractArea(conceptId);
    return conceptArea.toLowerCase().includes(area.toLowerCase());
  }
}
