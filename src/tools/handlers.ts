/**
 * MCP Tool Handlers
 *
 * Implementation of all MCP tool handlers using the service layer.
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type {
  ConceptLevel,
  LearningResult,
  TimePeriod,
  ShouldAskQuestionResponse,
  GetConceptLevelResponse,
  RecordLearningResponse,
  GetStatsResponse,
  GetReportDataResponse,
  GetUnknownUnknownsResponse,
  GetDueReviewsResponse,
  GetModeResponse,
  SetModeResponse,
  RecordUnknownUnknownResponse,
  MarkExploredResponse,
  SaveReportResponse,
  SaveUnknownsResponse,
  GetInterviewDataResponse,
} from '../types/index.js';
import {
  FatigueService,
  LearningService,
  StatsService,
  ReportService,
  UnknownUnknownsService,
  ModeService,
  InterviewService,
} from '../services/index.js';
import { VibeLearningError } from '../core/errors.js';

/**
 * Container for all tool handler instances
 */
export class ToolHandlers {
  private readonly fatigueService: FatigueService;
  private readonly learningService: LearningService;
  private readonly statsService: StatsService;
  private readonly reportService: ReportService;
  private readonly unknownsService: UnknownUnknownsService;
  private readonly modeService: ModeService;
  private readonly interviewService: InterviewService;

  constructor() {
    this.fatigueService = new FatigueService();
    this.learningService = new LearningService();
    this.statsService = new StatsService();
    this.reportService = new ReportService();
    this.unknownsService = new UnknownUnknownsService();
    this.modeService = new ModeService();
    this.interviewService = new InterviewService();
  }

  /**
   * should_ask_question - Check if a question should be asked
   */
  shouldAskQuestion(): ShouldAskQuestionResponse {
    try {
      return this.fatigueService.shouldAskQuestion();
    } catch (error) {
      if (error instanceof VibeLearningError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * get_concept_level - Get current level for a concept
   */
  getConceptLevel(conceptId: string): GetConceptLevelResponse {
    try {
      return this.learningService.getConceptLevel(conceptId);
    } catch (error) {
      if (error instanceof VibeLearningError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * record_learning - Record a learning attempt
   */
  recordLearning(conceptId: string, level: ConceptLevel, result: LearningResult): RecordLearningResponse {
    try {
      // Record the question was asked if it's a real attempt
      if (result !== 'skipped') {
        this.fatigueService.recordQuestion();
      }

      return this.learningService.recordLearning(conceptId, level, result);
    } catch (error) {
      if (error instanceof VibeLearningError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * get_stats - Get learning statistics
   */
  getStats(period: TimePeriod = 'month'): GetStatsResponse {
    try {
      return this.statsService.getStats(period);
    } catch (error) {
      if (error instanceof VibeLearningError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * get_report_data - Get comprehensive report data
   */
  getReportData(period: TimePeriod = 'week', area?: string): GetReportDataResponse {
    try {
      return this.reportService.getReportData(period, area);
    } catch (error) {
      if (error instanceof VibeLearningError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * get_unknown_unknowns - Get unexplored concepts
   */
  getUnknownUnknowns(period: TimePeriod = 'month', limit = 10): GetUnknownUnknownsResponse {
    try {
      return this.unknownsService.getUnknownUnknowns(period, limit);
    } catch (error) {
      if (error instanceof VibeLearningError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * record_unknown_unknown - Record a new unknown unknown
   */
  recordUnknownUnknown(
    conceptId: string,
    relatedTo: string,
    context: string,
    whyImportant: string
  ): RecordUnknownUnknownResponse {
    try {
      return this.unknownsService.recordUnknownUnknown(conceptId, relatedTo, context, whyImportant);
    } catch (error) {
      if (error instanceof VibeLearningError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * mark_explored - Mark an unknown unknown as explored
   */
  markExplored(conceptId: string): MarkExploredResponse {
    try {
      return this.unknownsService.markExplored(conceptId);
    } catch (error) {
      if (error instanceof VibeLearningError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * get_due_reviews - Get concepts due for review
   */
  getDueReviews(limit = 5): GetDueReviewsResponse {
    try {
      const reviews = this.learningService.getDueReviews(limit);
      return {
        reviews: reviews.map((r) => ({
          conceptId: r.conceptId,
          currentLevel: r.currentLevel,
          daysOverdue: r.daysOverdue,
          lastResult: r.lastResult,
        })),
        totalDue: reviews.length,
      };
    } catch (error) {
      if (error instanceof VibeLearningError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * get_mode - Get current learning mode
   */
  getMode(): GetModeResponse {
    try {
      return this.modeService.getMode();
    } catch (error) {
      if (error instanceof VibeLearningError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * set_mode - Set learning mode with independent senior/after toggles
   */
  setMode(
    seniorEnabled?: boolean,
    afterEnabled?: boolean,
    pausedUntil?: string,
    focusArea?: string | null
  ): SetModeResponse {
    try {
      let result: SetModeResponse | undefined;

      // Handle pause if specified
      if (pausedUntil) {
        const until = new Date(pausedUntil);
        this.fatigueService.pauseUntil(until);
        result = this.modeService.pause(0);
      }

      // Set modes if specified
      if (seniorEnabled !== undefined || afterEnabled !== undefined) {
        const currentState = this.modeService.getMode();
        const newSenior = seniorEnabled ?? currentState.seniorEnabled;
        const newAfter = afterEnabled ?? currentState.afterEnabled;
        result = this.modeService.setModes(newSenior, newAfter);
      }

      // Handle focus area if specified
      if (focusArea !== undefined) {
        result = this.modeService.setFocusArea(focusArea);
      }

      // If nothing was updated, return current mode state
      if (!result) {
        const current = this.modeService.getMode();
        return {
          updated: false,
          seniorEnabled: current.seniorEnabled,
          afterEnabled: current.afterEnabled,
          message: 'No changes made.',
          seniorBehavior: current.seniorBehavior,
          afterBehavior: current.afterBehavior,
        };
      }

      // Add focusArea to response for convenience
      const state = this.modeService.getMode();
      return {
        ...result,
        focusArea: state.focusArea,
        pausedUntil: state.pausedUntil,
      };
    } catch (error) {
      if (error instanceof VibeLearningError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * save_report - Save learning report to markdown file
   */
  saveReport(period: TimePeriod = 'week', area?: string, filename?: string): SaveReportResponse {
    try {
      const report = this.reportService.getReportData(period, area);

      // Generate filename
      const date = new Date().toISOString().split('T')[0];
      const defaultFilename = `vibe-learning-report-${period}-${date}.md`;
      const finalFilename = filename || defaultFilename;
      const filePath = join(homedir(), '.vibe-learning', finalFilename);

      // Generate markdown content
      const md = this.generateReportMarkdown(report);

      // Write to file
      writeFileSync(filePath, md, 'utf-8');

      return {
        saved: true,
        filePath,
        period: report.period,
        message: `Report saved to ${filePath}`,
      };
    } catch (error) {
      if (error instanceof VibeLearningError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * get_interview_data - Get interview preparation data
   */
  getInterviewData(period: TimePeriod = 'month'): GetInterviewDataResponse {
    try {
      return this.interviewService.getInterviewData(period);
    } catch (error) {
      if (error instanceof VibeLearningError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * save_unknowns - Save unknown unknowns to markdown file
   */
  saveUnknowns(period: TimePeriod = 'month', limit = 20, filename?: string): SaveUnknownsResponse {
    try {
      const unknowns = this.unknownsService.getUnknownUnknowns(period, limit);

      // Generate filename
      const date = new Date().toISOString().split('T')[0];
      const defaultFilename = `vibe-learning-unknowns-${date}.md`;
      const finalFilename = filename || defaultFilename;
      const filePath = join(homedir(), '.vibe-learning', finalFilename);

      // Generate markdown content
      const md = this.generateUnknownsMarkdown(unknowns);

      // Write to file
      writeFileSync(filePath, md, 'utf-8');

      return {
        saved: true,
        filePath,
        count: unknowns.unknowns.length,
        message: `Unknown unknowns saved to ${filePath}`,
      };
    } catch (error) {
      if (error instanceof VibeLearningError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Generate markdown for learning report
   */
  private generateReportMarkdown(report: GetReportDataResponse): string {
    const lines: string[] = [
      '# VibeLearning Report',
      '',
      `**Period:** ${report.period}`,
      `**Generated:** ${new Date().toISOString().split('T')[0]}`,
      '',
      '---',
      '',
      '## Summary',
      '',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Concepts Touched | ${report.summary.conceptsTouched} |`,
      `| New Concepts | ${report.summary.newConcepts} |`,
      `| Repeated | ${report.summary.repeatedConcepts} |`,
      `| Questions Asked | ${report.summary.questionsAsked} |`,
      `| Questions Answered | ${report.summary.questionsAnswered} |`,
      `| Skip Rate | ${(report.summary.skipRate * 100).toFixed(1)}% |`,
      `| Avg Level | ${report.summary.avgLevelStart.toFixed(1)} → ${report.summary.avgLevelEnd.toFixed(1)} |`,
      '',
    ];

    // Weak areas
    if (report.weakAreas.length > 0) {
      lines.push('## 🔴 Weak Areas', '');
      for (const area of report.weakAreas) {
        lines.push(`### ${area.area}`);
        lines.push(`- Concepts: ${area.concepts.join(', ')}`);
        lines.push(`- Appearances: ${area.appearances}`);
        lines.push(`- Avg Level: ${area.avgLevel.toFixed(1)}`);
        if (area.signals.length > 0) {
          lines.push(`- Signals: ${area.signals.join(', ')}`);
        }
        lines.push('');
      }
    }

    // Strong areas
    if (report.strongAreas.length > 0) {
      lines.push('## 🟢 Strong Areas', '');
      for (const area of report.strongAreas) {
        lines.push(`### ${area.area}`);
        lines.push(`- Concepts: ${area.concepts.join(', ')}`);
        lines.push(`- Avg Level: ${area.avgLevel.toFixed(1)}`);
        lines.push(`- Correct Rate: ${(area.correctRate * 100).toFixed(1)}%`);
        lines.push('');
      }
    }

    // Unknown unknowns
    if (report.unknownUnknowns.length > 0) {
      lines.push('## 💡 Unknown Unknowns', '');
      for (const uu of report.unknownUnknowns) {
        lines.push(`- **${uu.conceptId}** (related to ${uu.relatedTo})`);
        lines.push(`  - ${uu.whyImportant}`);
      }
      lines.push('');
    }

    // Skipped concepts
    if (report.skippedConcepts.length > 0) {
      lines.push('## ⏭️ Skipped Concepts', '');
      for (const sc of report.skippedConcepts) {
        lines.push(`- ${sc.conceptId}: skipped ${sc.skipCount}x (last: ${sc.lastSkipped})`);
      }
      lines.push('');
    }

    // Trends
    lines.push('## 📈 Trends', '');
    lines.push(`- Concepts Touched: ${report.trends.vsLastPeriod.conceptsTouched}`);
    lines.push(`- Avg Level: ${report.trends.vsLastPeriod.avgLevel}`);
    lines.push(`- Correct Rate: ${report.trends.vsLastPeriod.correctRate}`);
    lines.push('');

    lines.push('---');
    lines.push('*Generated by VibeLearning*');

    return lines.join('\n');
  }

  /**
   * Generate markdown for unknown unknowns
   */
  private generateUnknownsMarkdown(data: GetUnknownUnknownsResponse): string {
    const lines: string[] = [
      '# VibeLearning - Unknown Unknowns',
      '',
      `**Period:** ${data.period}`,
      `**Generated:** ${new Date().toISOString().split('T')[0]}`,
      `**Total Count:** ${data.totalCount} (Explored: ${data.exploredThisPeriod})`,
      '',
      '---',
      '',
    ];

    // Group by priority
    const high = data.unknowns.filter((u) => u.priority === 'high');
    const medium = data.unknowns.filter((u) => u.priority === 'medium');
    const low = data.unknowns.filter((u) => u.priority === 'low');

    if (high.length > 0) {
      lines.push('## 🔴 High Priority', '');
      lines.push('Frequently encountered but unexplored concepts', '');
      for (const u of high) {
        lines.push(`### ${u.conceptId}`);
        lines.push(`- **Related To:** ${u.relatedTo}`);
        lines.push(`- **Appearances:** ${u.appearances}`);
        lines.push(`- **Context:** ${u.context}`);
        lines.push(`- **Why Important:** ${u.whyImportant}`);
        lines.push('');
      }
    }

    if (medium.length > 0) {
      lines.push('## 🟡 Medium Priority', '');
      for (const u of medium) {
        lines.push(`- **${u.conceptId}** (related to ${u.relatedTo}, ${u.appearances} appearances)`);
        lines.push(`  - ${u.whyImportant}`);
      }
      lines.push('');
    }

    if (low.length > 0) {
      lines.push('## 🟢 Low Priority', '');
      for (const u of low) {
        lines.push(`- ${u.conceptId} (related to ${u.relatedTo})`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('*Generated by VibeLearning*');

    return lines.join('\n');
  }
}

/**
 * Singleton instance of tool handlers
 */
let handlersInstance: ToolHandlers | null = null;

/**
 * Gets the tool handlers instance
 */
export function getToolHandlers(): ToolHandlers {
  if (!handlersInstance) {
    handlersInstance = new ToolHandlers();
  }
  return handlersInstance;
}

/**
 * Resets the handlers instance (for testing)
 */
export function resetToolHandlers(): void {
  handlersInstance = null;
}
