/**
 * Repository Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  ConceptProgressRepository,
  LearningRecordRepository,
  SessionStateRepository,
  ModeStateRepository,
  UnknownUnknownsRepository,
  resetDatabase,
  getDatabaseConnection,
} from '../../src/db/index.js';

const TEST_DB_DIR = path.join(os.tmpdir(), 'vibe-learning-repo-test-' + Date.now());

describe('Repositories', () => {
  beforeEach(() => {
    // Clean up any existing test database
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
    getDatabaseConnection({ dbDir: TEST_DB_DIR });
  });

  afterEach(() => {
    resetDatabase();
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
  });

  describe('ConceptProgressRepository', () => {
    it('should create and retrieve a concept', () => {
      const repo = new ConceptProgressRepository();
      const concept = repo.getOrCreate('test-concept');

      expect(concept.conceptId).toBe('test-concept');
      expect(concept.currentLevel).toBe(3); // Default level is 3 (mid-level)
      expect(concept.easinessFactor).toBe(2.5);
    });

    it('should return existing concept', () => {
      const repo = new ConceptProgressRepository();
      const first = repo.getOrCreate('test-concept');
      const second = repo.getOrCreate('test-concept');

      expect(first.conceptId).toBe(second.conceptId);
    });

    it('should update concept progress', () => {
      const repo = new ConceptProgressRepository();
      repo.getOrCreate('test-concept');

      const updated = repo.update('test-concept', {
        currentLevel: 3,
        easinessFactor: 2.7,
      });

      expect(updated.currentLevel).toBe(3);
      expect(updated.easinessFactor).toBe(2.7);
    });

    it('should count concepts', () => {
      const repo = new ConceptProgressRepository();
      repo.getOrCreate('concept-1');
      repo.getOrCreate('concept-2');
      repo.getOrCreate('concept-3');

      expect(repo.count()).toBe(3);
    });
  });

  describe('LearningRecordRepository', () => {
    it('should create and retrieve records', () => {
      const progressRepo = new ConceptProgressRepository();
      progressRepo.getOrCreate('test-concept');

      const repo = new LearningRecordRepository();
      const record = repo.create({
        conceptId: 'test-concept',
        level: 2,
        result: 'correct',
      });

      expect(record.conceptId).toBe('test-concept');
      expect(record.level).toBe(2);
      expect(record.result).toBe('correct');
    });

    it('should get records by concept', () => {
      const progressRepo = new ConceptProgressRepository();
      progressRepo.getOrCreate('test-concept');

      const repo = new LearningRecordRepository();
      repo.create({ conceptId: 'test-concept', level: 1, result: 'correct' });
      repo.create({ conceptId: 'test-concept', level: 2, result: 'partial' });

      const records = repo.getByConceptId('test-concept');
      expect(records).toHaveLength(2);
    });

    it('should count by result', () => {
      const progressRepo = new ConceptProgressRepository();
      progressRepo.getOrCreate('test-concept');

      const repo = new LearningRecordRepository();
      repo.create({ conceptId: 'test-concept', level: 1, result: 'correct' });
      repo.create({ conceptId: 'test-concept', level: 1, result: 'correct' });
      repo.create({ conceptId: 'test-concept', level: 1, result: 'incorrect' });

      const counts = repo.countByResult('month');
      expect(counts.correct).toBe(2);
      expect(counts.incorrect).toBe(1);
    });
  });

  describe('SessionStateRepository', () => {
    it('should get initial session state', () => {
      const repo = new SessionStateRepository();
      const state = repo.get();

      expect(state.questionsToday).toBe(0);
      expect(state.consecutiveSkips).toBe(0);
    });

    it('should record questions', () => {
      const repo = new SessionStateRepository();
      repo.recordQuestion();
      const state = repo.get();

      expect(state.questionsToday).toBe(1);
      expect(state.lastQuestionAt).not.toBeNull();
    });

    it('should record skips', () => {
      const repo = new SessionStateRepository();
      repo.recordSkip();
      repo.recordSkip();
      const state = repo.get();

      expect(state.consecutiveSkips).toBe(2);
    });

    it('should reset skips', () => {
      const repo = new SessionStateRepository();
      repo.recordSkip();
      repo.recordSkip();
      repo.resetSkips();
      const state = repo.get();

      expect(state.consecutiveSkips).toBe(0);
    });
  });

  describe('ModeStateRepository', () => {
    it('should get initial mode state with toggles enabled', () => {
      const repo = new ModeStateRepository();
      const state = repo.get();

      expect(state.seniorEnabled).toBe(true);
      expect(state.afterEnabled).toBe(true);
      expect(state.pausedUntil).toBeNull();
      expect(state.focusArea).toBeNull();
    });

    it('should update toggles independently', () => {
      const repo = new ModeStateRepository();
      repo.update({ seniorEnabled: false });
      const state = repo.get();

      expect(state.seniorEnabled).toBe(false);
      expect(state.afterEnabled).toBe(true); // Unchanged
    });

    it('should handle pause', () => {
      const repo = new ModeStateRepository();
      const future = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      repo.update({ pausedUntil: future });

      expect(repo.isPaused()).toBe(true);
    });

    it('should clear expired pause', () => {
      const repo = new ModeStateRepository();
      const past = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      repo.update({ pausedUntil: past });

      // Getting state should clear expired pause
      repo.get();
      expect(repo.isPaused()).toBe(false);
    });

    it('should set focus area', () => {
      const repo = new ModeStateRepository();
      repo.update({ focusArea: 'caching' });
      const state = repo.get();

      expect(state.focusArea).toBe('caching');
    });

    it('should clear focus area', () => {
      const repo = new ModeStateRepository();
      repo.update({ focusArea: 'caching' });
      repo.update({ focusArea: null });
      const state = repo.get();

      expect(state.focusArea).toBeNull();
    });
  });

  describe('UnknownUnknownsRepository', () => {
    it('should record unknown unknowns', () => {
      const repo = new UnknownUnknownsRepository();
      const unknown = repo.recordOrIncrement({
        conceptId: 'cache-stampede',
        relatedTo: 'cache-aside',
        context: 'Redis caching',
        whyImportant: 'Can cause DB overload',
      });

      expect(unknown.conceptId).toBe('cache-stampede');
      expect(unknown.appearances).toBe(1);
    });

    it('should increment appearances on duplicate', () => {
      const repo = new UnknownUnknownsRepository();
      repo.recordOrIncrement({
        conceptId: 'cache-stampede',
        relatedTo: 'cache-aside',
        context: 'Redis caching',
        whyImportant: 'Can cause DB overload',
      });

      const second = repo.recordOrIncrement({
        conceptId: 'cache-stampede',
        relatedTo: 'cache-aside',
        context: 'More context',
        whyImportant: 'Updated reason',
      });

      expect(second.appearances).toBe(2);
    });

    it('should mark as explored', () => {
      const repo = new UnknownUnknownsRepository();
      repo.recordOrIncrement({
        conceptId: 'cache-stampede',
        relatedTo: 'cache-aside',
        context: 'Test',
        whyImportant: 'Test',
      });

      const result = repo.markExplored('cache-stampede');
      expect(result?.explored).toBe(true);
      expect(result?.exploredAt).not.toBeNull();
    });

    it('should get unexplored items', () => {
      const repo = new UnknownUnknownsRepository();
      repo.recordOrIncrement({
        conceptId: 'unknown-1',
        relatedTo: 'known-1',
        context: 'Test',
        whyImportant: 'Test',
      });
      repo.recordOrIncrement({
        conceptId: 'unknown-2',
        relatedTo: 'known-1',
        context: 'Test',
        whyImportant: 'Test',
      });

      const unexplored = repo.getUnexplored('month');
      expect(unexplored).toHaveLength(2);
    });
  });
});
