/**
 * VibeLearning MCP Response Types
 *
 * Strongly-typed response interfaces for all MCP tools.
 */

import type {
  ConceptLevel,
  LearningResult,
  StatsSummary,
  StrongArea,
  UnknownPriority,
  WeakArea,
} from './domain.js';

/**
 * Response from should_ask_question tool
 */
export interface ShouldAskQuestionResponse {
  readonly shouldAsk: boolean;
  readonly reason: string;
  readonly pendingReviews: number;
  readonly consecutiveSkips: number;
}

/**
 * Response from get_concept_level tool
 */
export interface GetConceptLevelResponse {
  readonly conceptId: string;
  readonly currentLevel: ConceptLevel;
  readonly totalAttempts: number;
  readonly lastSeen: string | null;
}

/**
 * Response from record_learning tool
 */
export interface RecordLearningResponse {
  readonly recorded: boolean;
  readonly newLevel: ConceptLevel;
  readonly nextReview: string;
  readonly message: string;
  readonly levelChanged: boolean;
  readonly consecutiveSkips: number;
}

/**
 * Response from get_stats tool
 */
export interface GetStatsResponse {
  readonly period: string;
  readonly summary: StatsSummary;
  readonly byConcept: readonly ConceptStatsResponse[];
  readonly streakDays: number;
}

/**
 * Concept stats in response format
 */
export interface ConceptStatsResponse {
  readonly conceptId: string;
  readonly currentLevel: ConceptLevel;
  readonly attempts: number;
  readonly correctRate: number;
  readonly lastSeen: string;
}

/**
 * Unknown unknown item in response
 */
export interface UnknownUnknownItem {
  readonly conceptId: string;
  readonly relatedTo: string;
  readonly appearances: number;
  readonly explored: boolean;
  readonly priority: UnknownPriority;
  readonly context: string;
  readonly whyImportant: string;
}

/**
 * Response from get_unknown_unknowns tool
 */
export interface GetUnknownUnknownsResponse {
  readonly period: string;
  readonly unknowns: readonly UnknownUnknownItem[];
  readonly totalCount: number;
  readonly exploredThisPeriod: number;
  readonly formattedOutput: string;
}

/**
 * Report data response - comprehensive learning data for report generation
 */
export interface GetReportDataResponse {
  readonly period: string;
  readonly summary: ReportSummary;
  readonly weakAreas: readonly WeakArea[];
  readonly strongAreas: readonly StrongArea[];
  readonly unknownUnknowns: readonly UnknownUnknownItem[];
  readonly trends: ReportTrends;
  readonly skippedConcepts: readonly SkippedConceptResponse[];
  readonly formattedOutput: string;
}

/**
 * Report summary statistics
 */
export interface ReportSummary {
  readonly conceptsTouched: number;
  readonly newConcepts: number;
  readonly repeatedConcepts: number;
  readonly questionsAsked: number;
  readonly questionsAnswered: number;
  readonly skipRate: number;
  readonly avgLevelStart: number;
  readonly avgLevelEnd: number;
}

/**
 * Trends comparing current period to previous
 */
export interface ReportTrends {
  readonly vsLastPeriod: {
    readonly conceptsTouched: string;
    readonly avgLevel: string;
    readonly correctRate: string;
  };
}

/**
 * Skipped concept in response format
 */
export interface SkippedConceptResponse {
  readonly conceptId: string;
  readonly skipCount: number;
  readonly lastSkipped: string;
}

/**
 * Response from get_due_reviews tool
 */
export interface GetDueReviewsResponse {
  readonly reviews: readonly DueReviewResponse[];
  readonly totalDue: number;
}

/**
 * Due review item in response format
 */
export interface DueReviewResponse {
  readonly conceptId: string;
  readonly currentLevel: ConceptLevel;
  readonly daysOverdue: number;
  readonly lastResult: LearningResult;
}

/**
 * Response from get_mode tool
 */
export interface GetModeResponse {
  readonly seniorEnabled: boolean;
  readonly afterEnabled: boolean;
  readonly pausedUntil: string | null;
  readonly focusArea: string | null;
  readonly seniorBehavior: string;
  readonly afterBehavior: string;
}

/**
 * Response from set_mode tool
 */
export interface SetModeResponse {
  readonly updated: boolean;
  readonly seniorEnabled: boolean;
  readonly afterEnabled: boolean;
  readonly message: string;
  readonly seniorBehavior: string;
  readonly afterBehavior: string;
  readonly focusArea?: string | null;
  readonly pausedUntil?: string | null;
}

/**
 * Response from record_unknown_unknown tool
 */
export interface RecordUnknownUnknownResponse {
  readonly recorded: boolean;
  readonly conceptId: string;
  readonly isNew: boolean;
  readonly appearances: number;
}

/**
 * Response from mark_explored tool
 */
export interface MarkExploredResponse {
  readonly updated: boolean;
  readonly conceptId: string;
  readonly message: string;
}

/**
 * Response from save_report tool
 */
export interface SaveReportResponse {
  readonly saved: boolean;
  readonly filePath: string;
  readonly period: string;
  readonly message: string;
}

/**
 * Response from save_unknowns tool
 */
export interface SaveUnknownsResponse {
  readonly saved: boolean;
  readonly filePath: string;
  readonly count: number;
  readonly message: string;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  readonly success: false;
  readonly code: string;
  readonly message: string;
  readonly suggestion?: string;
}

/**
 * Success wrapper for consistent API responses
 */
export interface SuccessResponse<T> {
  readonly success: true;
  readonly data: T;
}

/**
 * Union type for API responses
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
