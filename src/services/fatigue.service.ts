/**
 * Fatigue Management Service
 *
 * Manages question frequency to prevent user burnout.
 * Core principle: "If in doubt, don't ask"
 */

import type { ShouldAskQuestionResponse } from '../types/index.js';
import { SessionStateRepository, ModeStateRepository, ConceptProgressRepository } from '../db/index.js';
import { FATIGUE_CONFIG } from '../core/constants.js';
import { minutesBetween, addHours, formatDuration, formatDurationBetween } from '../core/utils.js';

/**
 * Result of fatigue check
 */
export interface FatigueCheckResult {
  readonly shouldAsk: boolean;
  readonly reason: string;
  readonly consecutiveSkips: number;
}

/**
 * Service for managing question fatigue
 */
export class FatigueService {
  private readonly sessionRepo: SessionStateRepository;
  private readonly modeRepo: ModeStateRepository;
  private readonly progressRepo: ConceptProgressRepository;

  constructor(
    sessionRepo?: SessionStateRepository,
    modeRepo?: ModeStateRepository,
    progressRepo?: ConceptProgressRepository
  ) {
    this.sessionRepo = sessionRepo ?? new SessionStateRepository();
    this.modeRepo = modeRepo ?? new ModeStateRepository();
    this.progressRepo = progressRepo ?? new ConceptProgressRepository();
  }

  /**
   * Checks if a question should be asked
   *
   * Returns false if:
   * - Mode is 'off'
   * - Currently paused (including auto-pause from skips)
   * - Cooldown period not elapsed
   */
  shouldAskQuestion(): ShouldAskQuestionResponse {
    // Check mode first
    const modeState = this.modeRepo.get();

    // Check if both modes are off
    if (!modeState.seniorEnabled && !modeState.afterEnabled) {
      return this.buildResponse(false, 'Learning mode is off');
    }

    // Check if paused (includes auto-pause from consecutive skips)
    if (modeState.pausedUntil && new Date(modeState.pausedUntil) > new Date()) {
      const remaining = formatDurationBetween(new Date(), new Date(modeState.pausedUntil));
      return this.buildResponse(false, `Paused for ${remaining}`);
    }

    // Get session state
    const sessionState = this.sessionRepo.get();

    // Check cooldown
    if (sessionState.lastQuestionAt) {
      const minutesSinceLastQuestion = minutesBetween(new Date(sessionState.lastQuestionAt), new Date());
      if (minutesSinceLastQuestion < FATIGUE_CONFIG.COOLDOWN_MINUTES) {
        const waitMs = (FATIGUE_CONFIG.COOLDOWN_MINUTES - minutesSinceLastQuestion) * 60 * 1000;
        return this.buildResponse(
          false,
          `Cooldown: ${formatDuration(waitMs)} remaining`,
          sessionState.consecutiveSkips
        );
      }
    }

    // Build reason message
    let reason = 'Ready to ask';
    if (sessionState.lastQuestionAt) {
      const elapsed = formatDurationBetween(new Date(sessionState.lastQuestionAt), new Date());
      reason = `${elapsed} since last question`;
    } else {
      reason = 'First question';
    }

    return this.buildResponse(true, reason, sessionState.consecutiveSkips);
  }

  /**
   * Records that a question was asked
   */
  recordQuestion(): void {
    this.sessionRepo.recordQuestion();
  }

  /**
   * Records a skip
   * Auto-pauses for 1 hour if consecutive skips reach threshold
   */
  recordSkip(): number {
    const state = this.sessionRepo.recordSkip();

    // Auto-pause if consecutive skips reach threshold
    if (state.consecutiveSkips >= FATIGUE_CONFIG.MAX_CONSECUTIVE_SKIPS) {
      this.pauseForHours(FATIGUE_CONFIG.SKIP_PAUSE_HOURS);
      this.sessionRepo.resetSkips(); // Reset skips after pause
    }

    return state.consecutiveSkips;
  }

  /**
   * Resets consecutive skips (after user answers)
   */
  resetSkips(): void {
    this.sessionRepo.resetSkips();
  }

  /**
   * Pauses questions for specified hours
   */
  pauseForHours(hours: number): Date {
    const until = addHours(new Date(), hours);
    this.modeRepo.pauseUntil(until);
    return until;
  }

  /**
   * Pauses questions until specified time
   */
  pauseUntil(until: Date): void {
    this.modeRepo.pauseUntil(until);
  }

  /**
   * Clears pause
   */
  clearPause(): void {
    this.modeRepo.clearPause();
  }

  /**
   * Gets current session statistics
   */
  getSessionStats(): {
    questionsToday: number;
    consecutiveSkips: number;
    isPaused: boolean;
    pausedUntil: string | null;
  } {
    const sessionState = this.sessionRepo.get();
    const modeState = this.modeRepo.get();
    const isPaused = this.modeRepo.isPaused();

    return {
      questionsToday: sessionState.questionsToday,
      consecutiveSkips: sessionState.consecutiveSkips,
      isPaused,
      pausedUntil: isPaused && modeState.pausedUntil
        ? new Date(modeState.pausedUntil).toISOString()
        : null,
    };
  }

  /**
   * Builds the response object
   */
  private buildResponse(
    shouldAsk: boolean,
    reason: string,
    consecutiveSkips = 0
  ): ShouldAskQuestionResponse {
    // Get pending reviews count
    const dueReviews = this.progressRepo.getDueForReview(100);

    return {
      shouldAsk,
      reason,
      pendingReviews: dueReviews.length,
      consecutiveSkips,
    };
  }
}
