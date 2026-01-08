/**
 * Fatigue Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { FatigueService } from '../../src/services/fatigue.service.js';
import { resetDatabase, getDatabaseConnection } from '../../src/db/index.js';

const TEST_DB_DIR = path.join(os.tmpdir(), 'vibe-learning-fatigue-test-' + Date.now());

describe('FatigueService', () => {
  let service: FatigueService;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
    getDatabaseConnection({ dbDir: TEST_DB_DIR });
    service = new FatigueService();
  });

  afterEach(() => {
    resetDatabase();
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
  });

  describe('shouldAskQuestion', () => {
    it('should allow question initially', () => {
      const result = service.shouldAskQuestion();

      expect(result.shouldAsk).toBe(true);
      expect(result.consecutiveSkips).toBe(0);
    });

    it('should not ask when paused', () => {
      const future = new Date(Date.now() + 60 * 60 * 1000);
      service.pauseUntil(future);

      const result = service.shouldAskQuestion();
      expect(result.shouldAsk).toBe(false);
      expect(result.reason).toContain('Paused');
    });

    it('should include pending reviews count', () => {
      const result = service.shouldAskQuestion();
      expect(result.pendingReviews).toBeDefined();
      expect(typeof result.pendingReviews).toBe('number');
    });
  });

  describe('recordQuestion', () => {
    it('should increment question count', () => {
      service.recordQuestion();
      service.recordQuestion();

      const stats = service.getSessionStats();
      expect(stats.questionsToday).toBe(2);
    });
  });

  describe('recordSkip', () => {
    it('should increment skip count and return new count', () => {
      const count1 = service.recordSkip();
      const count2 = service.recordSkip();

      expect(count1).toBe(1);
      expect(count2).toBe(2);
    });

    it('should auto-pause after 2 consecutive skips', () => {
      service.recordSkip();
      service.recordSkip();

      const result = service.shouldAskQuestion();
      expect(result.shouldAsk).toBe(false);
      expect(result.reason).toContain('Paused');
    });

    it('should reset skips after auto-pause', () => {
      service.recordSkip();
      service.recordSkip();

      const stats = service.getSessionStats();
      expect(stats.consecutiveSkips).toBe(0); // Reset after auto-pause
    });
  });

  describe('resetSkips', () => {
    it('should reset consecutive skips', () => {
      service.recordSkip();
      service.resetSkips();

      const stats = service.getSessionStats();
      expect(stats.consecutiveSkips).toBe(0);
    });
  });

  describe('pauseForHours', () => {
    it('should pause and return the pause end time', () => {
      const before = Date.now();
      const until = service.pauseForHours(1);
      const after = Date.now();

      // Should be approximately 1 hour from now
      const expectedMin = before + 60 * 60 * 1000;
      const expectedMax = after + 60 * 60 * 1000;

      expect(until.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(until.getTime()).toBeLessThanOrEqual(expectedMax);
    });

    it('should make isPaused return true', () => {
      service.pauseForHours(1);
      const stats = service.getSessionStats();

      expect(stats.isPaused).toBe(true);
    });
  });

  describe('pauseUntil', () => {
    it('should pause learning', () => {
      const future = new Date(Date.now() + 60 * 60 * 1000);
      service.pauseUntil(future);

      const stats = service.getSessionStats();
      expect(stats.isPaused).toBe(true);
    });

    it('should not pause for past date', () => {
      const past = new Date(Date.now() - 60 * 60 * 1000);
      service.pauseUntil(past);

      const stats = service.getSessionStats();
      expect(stats.isPaused).toBe(false);
    });
  });

  describe('clearPause', () => {
    it('should clear pause', () => {
      const future = new Date(Date.now() + 60 * 60 * 1000);
      service.pauseUntil(future);
      service.clearPause();

      const stats = service.getSessionStats();
      expect(stats.isPaused).toBe(false);
    });
  });

  describe('getSessionStats', () => {
    it('should return session statistics', () => {
      const stats = service.getSessionStats();

      expect(stats).toHaveProperty('questionsToday');
      expect(stats).toHaveProperty('consecutiveSkips');
      expect(stats).toHaveProperty('isPaused');
      expect(stats).toHaveProperty('pausedUntil');
    });

    it('should return correct values after operations', () => {
      service.recordQuestion();
      service.recordQuestion();
      service.recordSkip();

      const stats = service.getSessionStats();

      expect(stats.questionsToday).toBe(2);
      expect(stats.consecutiveSkips).toBe(1);
    });

    it('should return pausedUntil when paused', () => {
      const future = new Date(Date.now() + 60 * 60 * 1000);
      service.pauseUntil(future);

      const stats = service.getSessionStats();

      expect(stats.isPaused).toBe(true);
      expect(stats.pausedUntil).not.toBeNull();
    });
  });
});
