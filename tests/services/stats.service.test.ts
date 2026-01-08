/**
 * Stats Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { StatsService } from '../../src/services/stats.service.js';
import { LearningService } from '../../src/services/learning.service.js';
import { resetDatabase, getDatabaseConnection } from '../../src/db/index.js';

const TEST_DB_DIR = path.join(os.tmpdir(), 'vibe-learning-stats-test-' + Date.now());

describe('StatsService', () => {
  let statsService: StatsService;
  let learningService: LearningService;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
    getDatabaseConnection({ dbDir: TEST_DB_DIR });
    statsService = new StatsService();
    learningService = new LearningService();
  });

  afterEach(() => {
    resetDatabase();
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
  });

  describe('getStats', () => {
    it('should return empty stats initially', () => {
      const stats = statsService.getStats('month');

      expect(stats.summary.totalConcepts).toBe(0);
      expect(stats.summary.totalAttempts).toBe(0);
      expect(stats.byConcept).toHaveLength(0);
    });

    it('should include recorded concepts', () => {
      learningService.getConceptLevel('concept-1');
      learningService.recordLearning('concept-1', 3, 'correct');

      const stats = statsService.getStats('month');

      expect(stats.summary.totalConcepts).toBe(1);
      expect(stats.summary.totalAttempts).toBe(1);
    });

    it('should calculate correct rate as decimal', () => {
      learningService.getConceptLevel('concept-1');
      learningService.recordLearning('concept-1', 3, 'correct');
      learningService.recordLearning('concept-1', 3, 'correct');
      learningService.recordLearning('concept-1', 3, 'incorrect');

      const stats = statsService.getStats('month');

      // 2 correct out of 3 total (excluding skips)
      // correctRate is a decimal (0.67), not percentage (66.67)
      expect(stats.summary.correctRate).toBeCloseTo(0.67, 1);
    });

    it('should filter by period', () => {
      learningService.getConceptLevel('concept-1');
      learningService.recordLearning('concept-1', 3, 'correct');

      const weekStats = statsService.getStats('week');
      const monthStats = statsService.getStats('month');
      const allStats = statsService.getStats('all');

      expect(weekStats.summary.totalAttempts).toBe(1);
      expect(monthStats.summary.totalAttempts).toBe(1);
      expect(allStats.summary.totalAttempts).toBe(1);
    });

    it('should include streak days', () => {
      learningService.getConceptLevel('concept-1');
      learningService.recordLearning('concept-1', 3, 'correct');

      const stats = statsService.getStats('month');

      expect(stats).toHaveProperty('streakDays');
      expect(typeof stats.streakDays).toBe('number');
    });

    it('should include period string', () => {
      const stats = statsService.getStats('month');

      expect(stats).toHaveProperty('period');
      expect(typeof stats.period).toBe('string');
      expect(stats.period).toContain('30 days');
    });
  });

  describe('byConcept breakdown', () => {
    it('should show per-concept stats', () => {
      learningService.getConceptLevel('concept-1');
      learningService.getConceptLevel('concept-2');
      learningService.recordLearning('concept-1', 3, 'correct');
      learningService.recordLearning('concept-1', 3, 'correct');
      learningService.recordLearning('concept-2', 3, 'incorrect');

      const stats = statsService.getStats('month');

      expect(stats.byConcept).toHaveLength(2);
      const concept1 = stats.byConcept.find(c => c.conceptId === 'concept-1');
      expect(concept1?.attempts).toBe(2);
      expect(concept1?.correctRate).toBe(1); // 100% as decimal
    });

    it('should sort by attempts descending', () => {
      learningService.getConceptLevel('concept-a');
      learningService.getConceptLevel('concept-b');
      learningService.recordLearning('concept-a', 3, 'correct');
      learningService.recordLearning('concept-b', 3, 'correct');
      learningService.recordLearning('concept-b', 3, 'correct');
      learningService.recordLearning('concept-b', 3, 'correct');

      const stats = statsService.getStats('month');

      expect(stats.byConcept[0]?.conceptId).toBe('concept-b');
      expect(stats.byConcept[0]?.attempts).toBe(3);
    });
  });

  describe('getSummary', () => {
    it('should return summary only', () => {
      learningService.getConceptLevel('concept-1');
      learningService.recordLearning('concept-1', 3, 'correct');

      const summary = statsService.getSummary('month');

      expect(summary).toHaveProperty('totalConcepts');
      expect(summary).toHaveProperty('totalAttempts');
      expect(summary).toHaveProperty('correctRate');
      expect(summary).toHaveProperty('avgLevel');
    });
  });

  describe('getStreak', () => {
    it('should return streak days', () => {
      const streak = statsService.getStreak();

      expect(typeof streak).toBe('number');
      expect(streak).toBeGreaterThanOrEqual(0);
    });
  });
});
