/**
 * VibeLearning Domain Types
 *
 * Core domain models representing learning concepts, progress tracking,
 * and spaced repetition states.
 */

/**
 * Learning result from a question attempt
 */
export type LearningResult = 'correct' | 'partial' | 'incorrect' | 'skipped';

/**
 * @deprecated Use ModeState.seniorEnabled and ModeState.afterEnabled instead
 * Kept for backward compatibility with old API responses
 */
export type LearningMode = 'after' | 'before' | 'off' | 'senior' | 'senior_light';

/**
 * Priority level for unknown unknowns
 */
export type UnknownPriority = 'high' | 'medium' | 'low';

/**
 * Time period for statistics and reports
 */
export type TimePeriod = 'week' | 'month' | 'all';

/**
 * Concept level representing depth of understanding (1-5)
 */
export type ConceptLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Learning record representing a single learning attempt
 */
export interface LearningRecord {
  readonly id: number;
  readonly conceptId: string;
  readonly level: ConceptLevel;
  readonly result: LearningResult;
  readonly createdAt: Date;
}

/**
 * Input for creating a new learning record
 */
export interface LearningRecordInput {
  readonly conceptId: string;
  readonly level: ConceptLevel;
  readonly result: LearningResult;
}

/**
 * Concept progress tracking SM-2 spaced repetition state
 */
export interface ConceptProgress {
  readonly conceptId: string;
  readonly currentLevel: ConceptLevel;
  readonly easinessFactor: number; // SM-2 E-Factor (default 2.5)
  readonly intervalDays: number;
  readonly nextReview: Date | null;
  readonly totalAttempts: number;
  readonly correctCount: number;
  readonly createdAt: Date;
}

/**
 * Session state for fatigue management
 */
export interface SessionState {
  readonly questionsToday: number;
  readonly lastQuestionAt: Date | null;
  readonly consecutiveSkips: number;
}

/**
 * Mode state configuration
 *
 * New architecture uses independent toggles:
 * - seniorEnabled: Pre-implementation questions (deep conceptual questioning)
 * - afterEnabled: Post-implementation questions (spaced repetition)
 *
 * Combinations:
 * - senior=on, after=on: Full learning (default)
 * - senior=on, after=off: Only pre-implementation questions
 * - senior=off, after=on: Only post-implementation questions
 * - senior=off, after=off: Off (recording continues)
 */
export interface ModeState {
  readonly seniorEnabled: boolean;
  readonly afterEnabled: boolean;
  readonly pausedUntil: Date | null;
  readonly focusArea: string | null;
}

/**
 * Unknown unknown concept - something the user encountered but hasn't explored
 */
export interface UnknownUnknown {
  readonly id: number;
  readonly conceptId: string;
  readonly relatedTo: string;
  readonly appearances: number;
  readonly explored: boolean;
  readonly context: string;
  readonly whyImportant: string;
  readonly firstSeen: Date;
  readonly exploredAt: Date | null;
}

/**
 * Input for creating a new unknown unknown
 */
export interface UnknownUnknownInput {
  readonly conceptId: string;
  readonly relatedTo: string;
  readonly context: string;
  readonly whyImportant: string;
}

/**
 * Statistics summary for a time period
 */
export interface StatsSummary {
  readonly totalConcepts: number;
  readonly totalAttempts: number;
  readonly correctRate: number;
  readonly avgLevel: number;
}

/**
 * Per-concept statistics
 */
export interface ConceptStats {
  readonly conceptId: string;
  readonly currentLevel: ConceptLevel;
  readonly attempts: number;
  readonly correctRate: number;
  readonly lastSeen: Date;
}

/**
 * Weak area identified in reports
 */
export interface WeakArea {
  readonly area: string;
  readonly concepts: readonly string[];
  readonly appearances: number;
  readonly avgLevel: number;
  readonly signals: readonly string[];
}

/**
 * Strong area identified in reports
 */
export interface StrongArea {
  readonly area: string;
  readonly concepts: readonly string[];
  readonly avgLevel: number;
  readonly correctRate: number;
}

/**
 * Skipped concept pattern
 */
export interface SkippedConcept {
  readonly conceptId: string;
  readonly skipCount: number;
  readonly lastSkipped: Date;
}

/**
 * Due review item
 */
export interface DueReview {
  readonly conceptId: string;
  readonly currentLevel: ConceptLevel;
  readonly daysOverdue: number;
  readonly lastResult: LearningResult;
}

/**
 * SM-2 calculation result
 */
export interface SM2Result {
  readonly easinessFactor: number;
  readonly intervalDays: number;
  readonly nextReview: Date;
}

/**
 * Senior mode round tracking
 */
export interface SeniorModeRound {
  readonly conceptId: string;
  readonly currentRound: number;
  readonly maxRounds: number;
  readonly passed: boolean;
}

/**
 * Interview topic with mastery data
 */
export interface InterviewTopic {
  readonly area: string;
  readonly implementations: number;
  readonly mastery: number; // 0-100
  readonly isWeak: boolean;
  readonly concepts: readonly string[];
  readonly avgLevel: number;
  readonly correctRate: number;
}
