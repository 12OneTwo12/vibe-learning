/**
 * Mode Service
 *
 * Manages learning mode state with independent senior/after toggles.
 *
 * New Architecture:
 * - seniorEnabled: Pre-implementation conceptual questions (default: on)
 * - afterEnabled: Post-implementation spaced repetition questions (default: on)
 */

import type { GetModeResponse, SetModeResponse } from '../types/index.js';
import { ModeStateRepository } from '../db/index.js';
import { addHours, formatISOString } from '../core/utils.js';

/**
 * Senior mode behavior instructions
 */
const SENIOR_BEHAVIOR = `BEFORE writing any code, test conceptual understanding like a senior developer. Minimum 2 rounds.

Format:
**[VibeLearning Senior Mode]**
[Round 1/3] [Senior-level question]?
_(skip: say "skip" to proceed)_

Question Style - Test understanding, not gather requirements:
- WRONG: "What data will you cache?" (requirements gathering)
- WRONG: "Redis or Memcached?" (tool selection)
- RIGHT: "Why do you need caching here?" (reasoning)
- RIGHT: "What is cache-aside pattern? How is it different from write-through?" (concept)
- RIGHT: "What problems can caching introduce?" (tradeoffs)

Flow:
- Round 1: Test conceptual understanding or ask WHY
- Round 2: Ask about tradeoffs, edge cases, or compare alternatives
- Round 3: (if needed) Give hint and ask again
- FINAL: Call record_learning + record_unknown_unknown, then say "Good! Implementing now."

ONE question per message. Wait for answer.`;

/**
 * After mode behavior instructions
 */
const AFTER_BEHAVIOR = `After task completion, follow this learning procedure:

1. Identify 1-3 key concepts used in the task (kebab-case: "redis-caching", "jwt-auth")

2. Record 1-2 unknown unknowns (related concepts user might not know):
   record_unknown_unknown({
     concept_id: "related-concept",
     related_to: "main-concept",
     context: "brief context",
     why_important: "why important"
   })

3. Call should_ask_question to check if question allowed

4. If shouldAsk is true:
   - Call get_concept_level for the main concept
   - Ask with format:
     **[VibeLearning]**
     _Learning Question (Level X)_
     [Your question]?
   - After user answers, call record_learning

5. If shouldAsk is false: skip silently`;

/**
 * Service for managing learning mode
 */
export class ModeService {
  private readonly modeRepo: ModeStateRepository;

  constructor(modeRepo?: ModeStateRepository) {
    this.modeRepo = modeRepo ?? new ModeStateRepository();
  }

  /**
   * Gets the current mode state with behavior instructions
   */
  getMode(): GetModeResponse {
    const state = this.modeRepo.get();
    const isPaused = this.modeRepo.isPaused();

    const seniorActive = isPaused ? false : state.seniorEnabled;
    const afterActive = isPaused ? false : state.afterEnabled;

    // Build formatted status output
    let modeStatus: string;
    if (isPaused) {
      modeStatus = `⏸️ Paused until ${state.pausedUntil}`;
    } else if (seniorActive && afterActive) {
      modeStatus = '🎓 Full Mode (Senior + After)';
    } else if (seniorActive) {
      modeStatus = '👨‍💼 Senior Mode Only';
    } else if (afterActive) {
      modeStatus = '📚 After Mode Only';
    } else {
      modeStatus = '💤 Off (recording continues)';
    }

    const focusInfo = state.focusArea ? `\n📍 Focus: ${state.focusArea}` : '';
    const formattedOutput = `**[VibeLearning]** ${modeStatus}${focusInfo}\n_Use /learn for commands_`;

    return {
      seniorEnabled: seniorActive,
      afterEnabled: afterActive,
      pausedUntil: state.pausedUntil ? formatISOString(state.pausedUntil) : null,
      focusArea: state.focusArea,
      seniorBehavior: seniorActive ? SENIOR_BEHAVIOR : '',
      afterBehavior: afterActive ? AFTER_BEHAVIOR : '',
      formattedOutput,
    };
  }

  /**
   * Sets senior mode enabled/disabled
   */
  setSeniorEnabled(enabled: boolean): SetModeResponse {
    this.modeRepo.setSeniorEnabled(enabled);
    const state = this.modeRepo.get();

    return {
      updated: true,
      seniorEnabled: state.seniorEnabled,
      afterEnabled: state.afterEnabled,
      message: enabled
        ? 'Senior mode enabled. Will ask conceptual questions before implementation.'
        : 'Senior mode disabled.',
      seniorBehavior: state.seniorEnabled ? SENIOR_BEHAVIOR : '',
      afterBehavior: state.afterEnabled ? AFTER_BEHAVIOR : '',
    };
  }

  /**
   * Sets after mode enabled/disabled
   */
  setAfterEnabled(enabled: boolean): SetModeResponse {
    this.modeRepo.setAfterEnabled(enabled);
    const state = this.modeRepo.get();

    return {
      updated: true,
      seniorEnabled: state.seniorEnabled,
      afterEnabled: state.afterEnabled,
      message: enabled
        ? 'After mode enabled. Will ask learning questions after task completion.'
        : 'After mode disabled.',
      seniorBehavior: state.seniorEnabled ? SENIOR_BEHAVIOR : '',
      afterBehavior: state.afterEnabled ? AFTER_BEHAVIOR : '',
    };
  }

  /**
   * Sets both modes at once
   */
  setModes(seniorEnabled: boolean, afterEnabled: boolean): SetModeResponse {
    this.modeRepo.setModes(seniorEnabled, afterEnabled);
    const state = this.modeRepo.get();

    let message: string;
    if (seniorEnabled && afterEnabled) {
      message = 'Full learning mode enabled. Questions before and after implementation.';
    } else if (seniorEnabled) {
      message = 'Senior mode only. Questions before implementation.';
    } else if (afterEnabled) {
      message = 'After mode only. Questions after task completion.';
    } else {
      message = 'Learning off. Recording continues for reports.';
    }

    return {
      updated: true,
      seniorEnabled: state.seniorEnabled,
      afterEnabled: state.afterEnabled,
      message,
      seniorBehavior: state.seniorEnabled ? SENIOR_BEHAVIOR : '',
      afterBehavior: state.afterEnabled ? AFTER_BEHAVIOR : '',
    };
  }

  /**
   * Convenience: Turn off all learning
   */
  turnOff(): SetModeResponse {
    return this.setModes(false, false);
  }

  /**
   * Convenience: Turn on full learning (default state)
   */
  turnOnFull(): SetModeResponse {
    return this.setModes(true, true);
  }

  /**
   * Pauses learning for specified duration
   */
  pause(hours = 1): SetModeResponse {
    const until = addHours(new Date(), hours);
    this.modeRepo.pauseUntil(until);
    const state = this.modeRepo.get();

    return {
      updated: true,
      seniorEnabled: state.seniorEnabled,
      afterEnabled: state.afterEnabled,
      message: `Paused for ${hours} hour(s). Will resume automatically.`,
      seniorBehavior: '',
      afterBehavior: '',
    };
  }

  /**
   * Resumes from pause
   */
  resume(): SetModeResponse {
    this.modeRepo.clearPause();
    const state = this.modeRepo.get();

    return {
      updated: true,
      seniorEnabled: state.seniorEnabled,
      afterEnabled: state.afterEnabled,
      message: 'Resumed from pause!',
      seniorBehavior: state.seniorEnabled ? SENIOR_BEHAVIOR : '',
      afterBehavior: state.afterEnabled ? AFTER_BEHAVIOR : '',
    };
  }

  /**
   * Sets focus area for questions
   */
  setFocusArea(area: string | null): SetModeResponse {
    this.modeRepo.setFocusArea(area);
    const state = this.modeRepo.get();

    const message = area ? `Focusing on ${area} area!` : 'Focus area cleared.';

    return {
      updated: true,
      seniorEnabled: state.seniorEnabled,
      afterEnabled: state.afterEnabled,
      message,
      seniorBehavior: state.seniorEnabled ? SENIOR_BEHAVIOR : '',
      afterBehavior: state.afterEnabled ? AFTER_BEHAVIOR : '',
    };
  }

  /**
   * Checks if learning is currently active (at least one mode enabled and not paused)
   */
  isLearningActive(): boolean {
    return !this.modeRepo.isLearningOff();
  }

  /**
   * Checks if senior mode is effectively active
   */
  isSeniorActive(): boolean {
    return this.modeRepo.isSeniorActive();
  }

  /**
   * Checks if after mode is effectively active
   */
  isAfterActive(): boolean {
    return this.modeRepo.isAfterActive();
  }

  /**
   * Gets the maximum rounds for senior mode
   * Always 3 when senior is enabled
   */
  getSeniorModeMaxRounds(): number {
    return this.isSeniorActive() ? 3 : 0;
  }
}
