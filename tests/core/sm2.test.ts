/**
 * SM-2 Algorithm Tests
 */

import { describe, it, expect } from 'vitest';
import {
  resultToQuality,
  calculateEasinessFactor,
  calculateInterval,
  isSuccessfulRepetition,
  calculateSM2,
  createInitialSM2State,
  daysUntilReview,
  isDueForReview,
  daysOverdue,
} from '../../src/core/sm2.js';
import { SM2_CONFIG } from '../../src/core/constants.js';

describe('SM-2 Algorithm', () => {
  describe('resultToQuality', () => {
    it('should map correct to quality 5', () => {
      expect(resultToQuality('correct')).toBe(5);
    });

    it('should map partial to quality 3', () => {
      expect(resultToQuality('partial')).toBe(3);
    });

    it('should map incorrect to quality 1', () => {
      expect(resultToQuality('incorrect')).toBe(1);
    });

    it('should map skipped to quality 0', () => {
      expect(resultToQuality('skipped')).toBe(0);
    });
  });

  describe('calculateEasinessFactor', () => {
    it('should increase EF for correct answers (quality 5)', () => {
      const newEF = calculateEasinessFactor(2.5, 5);
      expect(newEF).toBeGreaterThan(2.5);
    });

    it('should decrease EF for incorrect answers (quality 1)', () => {
      const newEF = calculateEasinessFactor(2.5, 1);
      expect(newEF).toBeLessThan(2.5);
    });

    it('should not go below minimum EF', () => {
      const newEF = calculateEasinessFactor(1.4, 1);
      expect(newEF).toBeGreaterThanOrEqual(SM2_CONFIG.MIN_EASINESS_FACTOR);
    });

    it('should not modify EF for skipped (quality 0)', () => {
      const newEF = calculateEasinessFactor(2.5, 0);
      expect(newEF).toBe(2.5);
    });
  });

  describe('calculateInterval', () => {
    it('should return 1 day for first repetition', () => {
      const interval = calculateInterval(1, 1, 2.5, 5);
      expect(interval).toBe(SM2_CONFIG.INITIAL_INTERVAL);
    });

    it('should return 3 days for second repetition', () => {
      const interval = calculateInterval(1, 2, 2.5, 5);
      expect(interval).toBe(SM2_CONFIG.SECOND_INTERVAL);
    });

    it('should multiply by EF for subsequent repetitions', () => {
      const interval = calculateInterval(6, 3, 2.5, 5);
      expect(interval).toBe(15); // 6 * 2.5 = 15
    });

    it('should reset to 1 day for quality < 3', () => {
      const interval = calculateInterval(10, 5, 2.5, 2);
      expect(interval).toBe(SM2_CONFIG.INITIAL_INTERVAL);
    });

    it('should keep interval for skipped (quality 0)', () => {
      const interval = calculateInterval(10, 5, 2.5, 0);
      expect(interval).toBe(10);
    });
  });

  describe('isSuccessfulRepetition', () => {
    it('should return true for quality >= 3', () => {
      expect(isSuccessfulRepetition(3)).toBe(true);
      expect(isSuccessfulRepetition(4)).toBe(true);
      expect(isSuccessfulRepetition(5)).toBe(true);
    });

    it('should return false for quality < 3', () => {
      expect(isSuccessfulRepetition(0)).toBe(false);
      expect(isSuccessfulRepetition(1)).toBe(false);
      expect(isSuccessfulRepetition(2)).toBe(false);
    });
  });

  describe('calculateSM2', () => {
    it('should calculate next state for correct answer', () => {
      const result = calculateSM2({
        currentEF: 2.5,
        currentInterval: 1,
        repetitionNumber: 1,
        result: 'correct',
      });

      expect(result.easinessFactor).toBeGreaterThanOrEqual(SM2_CONFIG.MIN_EASINESS_FACTOR);
      expect(result.intervalDays).toBe(SM2_CONFIG.SECOND_INTERVAL);
      expect(result.nextReview).toBeInstanceOf(Date);
    });

    it('should reset interval for incorrect answer', () => {
      const result = calculateSM2({
        currentEF: 2.5,
        currentInterval: 10,
        repetitionNumber: 5,
        result: 'incorrect',
      });

      expect(result.intervalDays).toBe(SM2_CONFIG.INITIAL_INTERVAL);
    });

    it('should not reset for partial answer', () => {
      const result = calculateSM2({
        currentEF: 2.5,
        currentInterval: 6,
        repetitionNumber: 2,
        result: 'partial',
      });

      // Partial is treated as successful (quality 3), so interval grows rather than resets
      // With rep 2 -> 3, interval = round(6 * EF) ≈ 14
      expect(result.intervalDays).toBeGreaterThan(SM2_CONFIG.INITIAL_INTERVAL);
      expect(result.intervalDays).not.toBe(SM2_CONFIG.INITIAL_INTERVAL); // Not reset
    });
  });

  describe('createInitialSM2State', () => {
    it('should create state with default values', () => {
      const state = createInitialSM2State();

      expect(state.easinessFactor).toBe(SM2_CONFIG.DEFAULT_EASINESS_FACTOR);
      expect(state.intervalDays).toBe(SM2_CONFIG.INITIAL_INTERVAL);
      expect(state.nextReview).toBeInstanceOf(Date);
    });
  });

  describe('daysUntilReview / isDueForReview / daysOverdue', () => {
    it('should calculate days until future review', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const days = daysUntilReview(futureDate);
      expect(days).toBeGreaterThanOrEqual(4);
      expect(days).toBeLessThanOrEqual(6);
    });

    it('should return true for past review dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);

      expect(isDueForReview(pastDate)).toBe(true);
    });

    it('should return false for future review dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      expect(isDueForReview(futureDate)).toBe(false);
    });

    it('should calculate days overdue', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);

      const overdue = daysOverdue(pastDate);
      expect(overdue).toBeGreaterThanOrEqual(2);
      expect(overdue).toBeLessThanOrEqual(4);
    });
  });
});
