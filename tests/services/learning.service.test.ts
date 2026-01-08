/**
 * Learning Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { LearningService } from '../../src/services/learning.service.js';
import { resetDatabase, getDatabaseConnection, ConceptProgressRepository } from '../../src/db/index.js';

const TEST_DB_DIR = path.join(os.tmpdir(), 'vibe-learning-service-test-' + Date.now());

describe('LearningService', () => {
  let service: LearningService;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
    getDatabaseConnection({ dbDir: TEST_DB_DIR });
    service = new LearningService();
  });

  afterEach(() => {
    resetDatabase();
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
  });

  describe('getConceptLevel', () => {
    it('should create new concept at level 3', () => {
      const result = service.getConceptLevel('new-concept');

      expect(result.conceptId).toBe('new-concept');
      expect(result.currentLevel).toBe(3);
      expect(result.totalAttempts).toBe(0);
      expect(result.lastSeen).toBeNull();
    });

    it('should normalize concept IDs', () => {
      const result = service.getConceptLevel('New Concept');
      expect(result.conceptId).toBe('new-concept');
    });

    it('should return existing concept', () => {
      service.getConceptLevel('test-concept');
      service.recordLearning('test-concept', 3, 'correct');

      const result = service.getConceptLevel('test-concept');
      expect(result.totalAttempts).toBe(1);
      expect(result.lastSeen).not.toBeNull();
    });
  });

  describe('recordLearning', () => {
    it('should record correct answer and level up', () => {
      service.getConceptLevel('test-concept');
      // First correct: levels up from 3 to 4
      const result = service.recordLearning('test-concept', 3, 'correct');

      expect(result.recorded).toBe(true);
      expect(result.newLevel).toBe(4); // Leveled up from 3
      expect(result.levelChanged).toBe(true);
      expect(result.consecutiveSkips).toBe(0);
    });

    it('should level down on incorrect answer', () => {
      service.getConceptLevel('test-concept'); // Level 3
      const result = service.recordLearning('test-concept', 3, 'incorrect');

      expect(result.recorded).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(result.levelChanged).toBe(true);
    });

    it('should not level down below 1', () => {
      service.getConceptLevel('test-concept');
      // Level down from 3 -> 2 -> 1
      service.recordLearning('test-concept', 3, 'incorrect');
      service.recordLearning('test-concept', 2, 'incorrect');
      const result = service.recordLearning('test-concept', 1, 'incorrect');

      expect(result.newLevel).toBe(1);
    });

    it('should maintain level on partial answer', () => {
      service.getConceptLevel('test-concept');
      const result = service.recordLearning('test-concept', 3, 'partial');

      expect(result.recorded).toBe(true);
      expect(result.newLevel).toBe(3);
      expect(result.levelChanged).toBe(false);
    });

    it('should increment consecutive skips', () => {
      service.getConceptLevel('test-concept');
      service.recordLearning('test-concept', 3, 'skipped');
      const result = service.recordLearning('test-concept', 3, 'skipped');

      expect(result.consecutiveSkips).toBe(2);
    });

    it('should reset consecutive skips on actual attempt', () => {
      service.getConceptLevel('test-concept');
      service.recordLearning('test-concept', 3, 'skipped');
      service.recordLearning('test-concept', 3, 'skipped');
      const result = service.recordLearning('test-concept', 3, 'correct');

      expect(result.consecutiveSkips).toBe(0);
    });

    it('should include next review date', () => {
      service.getConceptLevel('test-concept');
      const result = service.recordLearning('test-concept', 3, 'correct');

      expect(result.nextReview).toBeDefined();
      expect(typeof result.nextReview).toBe('string');
    });

    it('should include message', () => {
      service.getConceptLevel('test-concept');
      const result = service.recordLearning('test-concept', 3, 'correct');

      expect(result.message).toBeDefined();
      expect(result.message.length).toBeGreaterThan(0);
    });
  });

  describe('getDueReviews', () => {
    it('should return empty array when no concepts due', () => {
      const reviews = service.getDueReviews();
      expect(reviews).toHaveLength(0);
    });

    it('should respect limit parameter', () => {
      // Create multiple concepts
      service.getConceptLevel('concept-1');
      service.getConceptLevel('concept-2');
      service.getConceptLevel('concept-3');

      const reviews = service.getDueReviews(2);
      expect(reviews.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getProgress', () => {
    it('should return null for non-existent concept', () => {
      const progress = service.getProgress('non-existent');
      expect(progress).toBeNull();
    });

    it('should return progress for existing concept', () => {
      service.getConceptLevel('test-concept');
      const progress = service.getProgress('test-concept');

      expect(progress).not.toBeNull();
      expect(progress?.conceptId).toBe('test-concept');
    });
  });

  describe('getAllConcepts', () => {
    it('should return all concepts', () => {
      service.getConceptLevel('concept-1');
      service.getConceptLevel('concept-2');

      const concepts = service.getAllConcepts();
      expect(concepts).toHaveLength(2);
    });
  });

  describe('level up mechanics', () => {
    it('should level up after correct answer (fast level up)', () => {
      service.getConceptLevel('test-concept'); // Level 3
      const result = service.recordLearning('test-concept', 3, 'correct');

      // With CORRECT_TO_LEVEL_UP=2, a single correct in last 2 records levels up
      expect(result.newLevel).toBe(4);
      expect(result.levelChanged).toBe(true);
    });

    it('should continue leveling up with consecutive correct', () => {
      service.getConceptLevel('test-concept'); // Level 3
      service.recordLearning('test-concept', 3, 'correct'); // Level 4
      const result = service.recordLearning('test-concept', 4, 'correct'); // Level 5

      expect(result.newLevel).toBe(5);
      expect(result.levelChanged).toBe(true);
    });

    it('should not level up above 5', () => {
      const progressRepo = new ConceptProgressRepository();
      service.getConceptLevel('test-concept');
      // Set to level 5 directly
      progressRepo.update('test-concept', { currentLevel: 5 });

      // Try to level up
      service.recordLearning('test-concept', 5, 'correct');
      const result = service.recordLearning('test-concept', 5, 'correct');

      expect(result.newLevel).toBe(5);
    });

    it('should immediately level down on incorrect', () => {
      service.getConceptLevel('test-concept'); // Level 3
      const result = service.recordLearning('test-concept', 3, 'incorrect');

      expect(result.newLevel).toBe(2);
      expect(result.levelChanged).toBe(true);
    });
  });
});
