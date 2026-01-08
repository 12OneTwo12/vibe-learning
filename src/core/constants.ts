/**
 * VibeLearning Constants
 *
 * Configuration constants for fatigue management, SM-2 algorithm,
 * and other system-wide settings.
 */

/**
 * Fatigue management settings
 */
export const FATIGUE_CONFIG = {
  /** Minimum cooldown between questions in minutes */
  COOLDOWN_MINUTES: 15,

  /** Number of consecutive skips before auto-pause */
  MAX_CONSECUTIVE_SKIPS: 2,

  /** Hours to pause after consecutive skips */
  SKIP_PAUSE_HOURS: 1,

  /** Hours to pause after "busy" keyword detection */
  BUSY_PAUSE_HOURS: 24,

  /** Engagement rate threshold for auto-adjustment */
  LOW_ENGAGEMENT_THRESHOLD: 0.3,
} as const;

/**
 * SM-2 Algorithm settings
 */
export const SM2_CONFIG = {
  /** Default easiness factor for new concepts */
  DEFAULT_EASINESS_FACTOR: 2.5,

  /** Minimum easiness factor (floor) */
  MIN_EASINESS_FACTOR: 1.3,

  /** Initial interval in days for new concepts */
  INITIAL_INTERVAL: 1,

  /** Interval after first successful review */
  SECOND_INTERVAL: 3,

  /**
   * Quality scores for SM-2 based on result
   * 5 = perfect, 4 = correct with hesitation, 3 = correct with difficulty
   * 2 = incorrect but easy recall, 1 = incorrect, 0 = blackout
   */
  QUALITY_SCORES: {
    correct: 5,
    partial: 3,
    incorrect: 1,
    skipped: 0, // Treated as no attempt for SM-2
  },
} as const;

/**
 * Concept level configuration
 *
 * Philosophy: Start at Level 3 (mid-level) and adjust based on responses.
 * This respects experienced developers while quickly finding the right level.
 */
export const LEVEL_CONFIG = {
  /** Minimum level */
  MIN_LEVEL: 1,

  /** Maximum level */
  MAX_LEVEL: 5,

  /** Default level for new concepts (start at mid-level) */
  DEFAULT_LEVEL: 3,

  /** Correct answers needed to level up */
  CORRECT_TO_LEVEL_UP: 2,

  /** Incorrect answers to level down (immediate on first incorrect) */
  INCORRECT_TO_LEVEL_DOWN: 1,
} as const;

/**
 * Level descriptions for host LLM guidance
 */
export const LEVEL_DESCRIPTIONS = {
  1: {
    name: 'Recognition',
    questionStyle: 'Do you know what this is?',
    description: 'Basic awareness of the concept',
  },
  2: {
    name: 'Understanding',
    questionStyle: 'Can you explain how it works?',
    description: 'Can explain how it works',
  },
  3: {
    name: 'Comparison',
    questionStyle: 'When would you use X instead of Y?',
    description: 'Can compare trade-offs with alternatives',
  },
  4: {
    name: 'Edge Cases',
    questionStyle: 'What are the pitfalls of X and how do you handle them?',
    description: 'Knows edge cases and solutions',
  },
  5: {
    name: 'Architecture',
    questionStyle: 'How would you design X in a large-scale system?',
    description: 'Can design systems using the concept',
  },
} as const;

/**
 * Unknown unknowns priority thresholds
 */
export const UNKNOWN_PRIORITY_CONFIG = {
  /** Appearances for high priority */
  HIGH_THRESHOLD: 3,

  /** Appearances for medium priority */
  MEDIUM_THRESHOLD: 2,
} as const;

/**
 * Report configuration
 */
export const REPORT_CONFIG = {
  /** Days for weekly report */
  WEEK_DAYS: 7,

  /** Days for monthly report */
  MONTH_DAYS: 30,

  /** Maximum weak areas to show */
  MAX_WEAK_AREAS: 5,

  /** Maximum unknown unknowns to show */
  MAX_UNKNOWNS: 10,
} as const;

/**
 * Senior mode configuration
 */
export const SENIOR_MODE_CONFIG = {
  /** Maximum rounds for senior mode */
  MAX_ROUNDS: 3,

  /** Senior light mode - single round with feedback */
  LIGHT_MAX_ROUNDS: 1,
} as const;

/**
 * Database configuration
 */
export const DB_CONFIG = {
  /** Default database directory */
  DEFAULT_DIR: '.vibe-learning',

  /** Database filename */
  DB_FILENAME: 'learning.db',

  /** Reports directory */
  REPORTS_DIR: 'reports',
} as const;

/**
 * Error codes for consistent error handling
 */
export const ERROR_CODES = {
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR: 'DB_QUERY_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
