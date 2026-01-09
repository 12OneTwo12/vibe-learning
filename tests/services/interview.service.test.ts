/**
 * Interview Service Tests
 *
 * Uses repositories directly to set up predictable test data,
 * avoiding dependency on LearningService's SM-2 side effects.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { InterviewService } from '../../src/services/interview.service.js';
import {
  ConceptProgressRepository,
  LearningRecordRepository,
  resetDatabase,
  getDatabaseConnection,
} from '../../src/db/index.js';
import type { ConceptLevel, LearningResult } from '../../src/types/index.js';

const TEST_DB_DIR = path.join(os.tmpdir(), 'vibe-learning-interview-test-' + Date.now());

describe('InterviewService', () => {
  let interviewService: InterviewService;
  let progressRepo: ConceptProgressRepository;
  let recordRepo: LearningRecordRepository;

  // Helper to create a concept with specific level
  function createConcept(conceptId: string, level: ConceptLevel = 3): void {
    progressRepo.getOrCreate(conceptId);
    if (level !== 3) {
      progressRepo.update(conceptId, { currentLevel: level });
    }
  }

  // Helper to create a learning record directly
  function createRecord(conceptId: string, level: ConceptLevel, result: LearningResult): void {
    recordRepo.create({ conceptId, level, result });
  }

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
    getDatabaseConnection({ dbDir: TEST_DB_DIR });

    progressRepo = new ConceptProgressRepository();
    recordRepo = new LearningRecordRepository();
    interviewService = new InterviewService(progressRepo, recordRepo);
  });

  afterEach(() => {
    resetDatabase();
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
  });

  describe('getInterviewData', () => {
    it('should return empty data when no learning records', () => {
      const data = interviewService.getInterviewData('month');

      expect(data.topics).toHaveLength(0);
      expect(data.recommendedTopic).toBeNull();
      expect(data.totalConcepts).toBe(0);
    });

    it('should include interviewBehavior instructions', () => {
      const data = interviewService.getInterviewData('month');

      expect(data.interviewBehavior).toBeDefined();
      expect(data.interviewBehavior).toContain('technical interview');
    });

    it('should include formattedOutput', () => {
      const data = interviewService.getInterviewData('month');

      expect(data.formattedOutput).toBeDefined();
      expect(typeof data.formattedOutput).toBe('string');
    });

    it('should format no data output when empty', () => {
      const data = interviewService.getInterviewData('month');

      expect(data.formattedOutput).toContain('No learning data yet');
    });

    it('should group concepts by area prefix', () => {
      // Set up: 2 cache concepts, 1 auth concept
      createConcept('cache-aside', 3);
      createConcept('cache-invalidation', 3);
      createConcept('auth-jwt', 3);
      createRecord('cache-aside', 3, 'correct');
      createRecord('cache-invalidation', 3, 'correct');
      createRecord('auth-jwt', 3, 'correct');

      const data = interviewService.getInterviewData('month');

      expect(data.topics).toHaveLength(2);
      const cacheArea = data.topics.find(t => t.area === 'cache');
      const authArea = data.topics.find(t => t.area === 'auth');
      expect(cacheArea?.concepts).toHaveLength(2);
      expect(authArea?.concepts).toHaveLength(1);
    });

    it('should calculate mastery based on correctRate and level', () => {
      // Set up: concept at level 3, 100% correct rate
      createConcept('test-concept', 3);
      createRecord('test-concept', 3, 'correct');

      const data = interviewService.getInterviewData('month');
      const topic = data.topics[0];

      // mastery = (correctRate * 0.6 + normalizedLevel * 0.4) * 100
      // correctRate = 1.0, level = 3, normalizedLevel = 3/5 = 0.6
      // mastery = (1.0 * 0.6 + 0.6 * 0.4) * 100 = 84
      expect(topic?.mastery).toBe(84);
      expect(topic?.correctRate).toBe(1);
      expect(topic?.avgLevel).toBe(3);
    });

    it('should calculate mastery with mixed results', () => {
      // Set up: concept at level 2, 50% correct rate
      createConcept('mixed-concept', 2);
      createRecord('mixed-concept', 2, 'correct');
      createRecord('mixed-concept', 2, 'incorrect');

      const data = interviewService.getInterviewData('month');
      const topic = data.topics[0];

      // correctRate = 0.5, level = 2, normalizedLevel = 2/5 = 0.4
      // mastery = (0.5 * 0.6 + 0.4 * 0.4) * 100 = (0.3 + 0.16) * 100 = 46
      expect(topic?.mastery).toBe(46);
      expect(topic?.correctRate).toBe(0.5);
      expect(topic?.avgLevel).toBe(2);
    });

    it('should mark area as weak when mastery < 60%', () => {
      // Set up: concept at level 1, 0% correct rate -> mastery = 8%
      createConcept('weak-concept', 1);
      createRecord('weak-concept', 1, 'incorrect');

      const data = interviewService.getInterviewData('month');
      const topic = data.topics[0];

      expect(topic?.isWeak).toBe(true);
      expect(topic?.mastery).toBeLessThan(60);
    });

    it('should mark area as weak when avgLevel < 2.5', () => {
      // Set up: concept at level 2, 100% correct rate
      // mastery = (1.0 * 0.6 + 0.4 * 0.4) * 100 = 76 (not weak by mastery)
      // but avgLevel = 2 < 2.5, so should be weak
      createConcept('low-level-concept', 2);
      createRecord('low-level-concept', 2, 'correct');

      const data = interviewService.getInterviewData('month');
      const topic = data.topics[0];

      expect(topic?.avgLevel).toBe(2);
      expect(topic?.isWeak).toBe(true);
    });

    it('should not mark area as weak when mastery >= 60% and avgLevel >= 2.5', () => {
      // Set up: concept at level 4, 100% correct rate
      // mastery = (1.0 * 0.6 + 0.8 * 0.4) * 100 = 92
      createConcept('strong-concept', 4);
      createRecord('strong-concept', 4, 'correct');

      const data = interviewService.getInterviewData('month');
      const topic = data.topics[0];

      expect(topic?.mastery).toBe(92);
      expect(topic?.avgLevel).toBe(4);
      expect(topic?.isWeak).toBe(false);
    });

    it('should sort topics by mastery (weakest first)', () => {
      // Set up: strong area (level 5, 100%) and weak area (level 1, 0%)
      createConcept('strong-one', 5);
      createRecord('strong-one', 5, 'correct');

      createConcept('weak-one', 1);
      createRecord('weak-one', 1, 'incorrect');

      const data = interviewService.getInterviewData('month');

      expect(data.topics[0]?.area).toBe('weak');
      expect(data.topics[1]?.area).toBe('strong');
      expect(data.topics[0]!.mastery).toBeLessThan(data.topics[1]!.mastery);
    });

    it('should recommend topic with at least 2 implementations', () => {
      // Area with 1 implementation (not recommended)
      createConcept('single-concept', 3);
      createRecord('single-concept', 3, 'correct');

      // Area with 2 implementations (recommended)
      createConcept('multi-one', 2);
      createConcept('multi-two', 2);
      createRecord('multi-one', 2, 'incorrect');
      createRecord('multi-two', 2, 'incorrect');

      const data = interviewService.getInterviewData('month');

      // multi area has 2 implementations and is weaker
      expect(data.recommendedTopic).toBe('multi');
    });

    it('should return null recommendedTopic when no area has 2+ implementations', () => {
      createConcept('area1-concept', 3);
      createConcept('area2-concept', 3);
      createRecord('area1-concept', 3, 'correct');
      createRecord('area2-concept', 3, 'correct');

      const data = interviewService.getInterviewData('month');

      expect(data.recommendedTopic).toBeNull();
    });

    it('should count total concepts correctly', () => {
      createConcept('concept-1', 3);
      createConcept('concept-2', 3);
      createConcept('concept-3', 3);
      createRecord('concept-1', 3, 'correct');
      createRecord('concept-2', 3, 'correct');
      createRecord('concept-3', 3, 'correct');

      const data = interviewService.getInterviewData('month');

      expect(data.totalConcepts).toBe(3);
    });

    it('should respect period parameter', () => {
      createConcept('recent-concept', 3);
      createRecord('recent-concept', 3, 'correct');

      const weekData = interviewService.getInterviewData('week');
      const monthData = interviewService.getInterviewData('month');
      const allData = interviewService.getInterviewData('all');

      expect(weekData.totalConcepts).toBe(1);
      expect(monthData.totalConcepts).toBe(1);
      expect(allData.totalConcepts).toBe(1);
    });

    it('should include formatted output with topics', () => {
      createConcept('test-concept', 3);
      createRecord('test-concept', 3, 'correct');

      const data = interviewService.getInterviewData('month');

      expect(data.formattedOutput).toContain('VibeLearning Interview Prep');
      expect(data.formattedOutput).toContain('Technical Areas');
      expect(data.formattedOutput).toContain('test');
    });

    it('should exclude skipped attempts from correctRate calculation', () => {
      createConcept('skip-test', 3);
      createRecord('skip-test', 3, 'correct');
      createRecord('skip-test', 3, 'skipped');
      createRecord('skip-test', 3, 'skipped');

      const data = interviewService.getInterviewData('month');
      const topic = data.topics[0];

      // 1 correct out of 1 non-skipped = 100%
      expect(topic?.correctRate).toBe(1);
    });

    it('should calculate implementations as total attempts', () => {
      createConcept('impl-test', 3);
      createRecord('impl-test', 3, 'correct');
      createRecord('impl-test', 3, 'correct');
      createRecord('impl-test', 3, 'incorrect');

      const data = interviewService.getInterviewData('month');
      const topic = data.topics[0];

      expect(topic?.implementations).toBe(3);
    });
  });

  describe('getWeakTopics', () => {
    it('should return only weak topics', () => {
      // Create weak area (level 1)
      createConcept('weak-concept', 1);
      createRecord('weak-concept', 1, 'incorrect');

      // Create strong area (level 5, 100%)
      createConcept('strong-concept', 5);
      createRecord('strong-concept', 5, 'correct');

      const weakTopics = interviewService.getWeakTopics();

      expect(weakTopics.length).toBe(1);
      expect(weakTopics[0]?.area).toBe('weak');
      expect(weakTopics.every(t => t.isWeak)).toBe(true);
    });

    it('should respect limit parameter', () => {
      // Create 5 weak areas
      for (let i = 0; i < 5; i++) {
        const conceptId = `weak${i}-concept`;
        createConcept(conceptId, 1);
        createRecord(conceptId, 1, 'incorrect');
      }

      const weakTopics = interviewService.getWeakTopics(2);

      expect(weakTopics.length).toBe(2);
    });

    it('should return empty array when no weak topics', () => {
      // Create only strong area
      createConcept('strong-concept', 5);
      createRecord('strong-concept', 5, 'correct');

      const weakTopics = interviewService.getWeakTopics();

      expect(weakTopics).toHaveLength(0);
    });
  });

  describe('getStrongTopics', () => {
    it('should return only strong topics (not weak)', () => {
      // Create strong area (level 4, 100% correct)
      createConcept('strong-concept', 4);
      createRecord('strong-concept', 4, 'correct');

      // Create weak area (level 1)
      createConcept('weak-concept', 1);
      createRecord('weak-concept', 1, 'incorrect');

      const strongTopics = interviewService.getStrongTopics();

      expect(strongTopics.length).toBe(1);
      expect(strongTopics[0]?.area).toBe('strong');
      expect(strongTopics.every(t => !t.isWeak)).toBe(true);
    });

    it('should sort by mastery descending', () => {
      // Higher mastery area (level 5)
      createConcept('higher-concept', 5);
      createRecord('higher-concept', 5, 'correct');

      // Lower mastery area (level 3)
      createConcept('lower-concept', 3);
      createRecord('lower-concept', 3, 'correct');

      const strongTopics = interviewService.getStrongTopics();

      if (strongTopics.length >= 2) {
        expect(strongTopics[0]!.mastery).toBeGreaterThanOrEqual(strongTopics[1]!.mastery);
      }
    });

    it('should respect limit parameter', () => {
      // Create 5 strong areas
      for (let i = 0; i < 5; i++) {
        const conceptId = `strong${i}-concept`;
        createConcept(conceptId, 5);
        createRecord(conceptId, 5, 'correct');
      }

      const strongTopics = interviewService.getStrongTopics(2);

      expect(strongTopics.length).toBe(2);
    });
  });

  describe('area extraction', () => {
    it('should extract area from hyphenated concept ID', () => {
      createConcept('cache-aside-pattern', 3);
      createRecord('cache-aside-pattern', 3, 'correct');

      const data = interviewService.getInterviewData('month');

      expect(data.topics[0]?.area).toBe('cache');
    });

    it('should extract area from underscored concept ID', () => {
      createConcept('auth_jwt_token', 3);
      createRecord('auth_jwt_token', 3, 'correct');

      const data = interviewService.getInterviewData('month');

      expect(data.topics[0]?.area).toBe('auth');
    });

    it('should use first part for single-word concept ID', () => {
      createConcept('singleton', 3);
      createRecord('singleton', 3, 'correct');

      const data = interviewService.getInterviewData('month');

      // Single word becomes the area itself
      expect(data.topics[0]?.area).toBe('singleton');
    });
  });

  describe('average level calculation across multiple concepts', () => {
    it('should calculate avgLevel as average of all concepts in area', () => {
      // Two concepts in same area with different levels
      createConcept('avg-one', 2);
      createConcept('avg-two', 4);
      createRecord('avg-one', 2, 'correct');
      createRecord('avg-two', 4, 'correct');

      const data = interviewService.getInterviewData('month');
      const topic = data.topics[0];

      // avgLevel = (2 + 4) / 2 = 3
      expect(topic?.avgLevel).toBe(3);
    });
  });
});
