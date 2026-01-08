/**
 * Tool Handlers Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { ToolHandlers, resetToolHandlers } from '../../src/tools/index.js';
import { resetDatabase, getDatabaseConnection } from '../../src/db/index.js';

const TEST_DB_DIR = path.join(os.tmpdir(), 'vibe-learning-handlers-test-' + Date.now());

describe('Tool Handlers', () => {
  let handlers: ToolHandlers;

  beforeEach(() => {
    // Clean up any existing test database
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
    getDatabaseConnection({ dbDir: TEST_DB_DIR });
    handlers = new ToolHandlers();
  });

  afterEach(() => {
    resetDatabase();
    resetToolHandlers();
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
  });

  describe('shouldAskQuestion', () => {
    it('should return shouldAsk=true initially', () => {
      const result = handlers.shouldAskQuestion();

      expect(result.shouldAsk).toBe(true);
      expect(result.pendingReviews).toBeGreaterThanOrEqual(0);
    });

    it('should return shouldAsk=false when both modes are off', () => {
      handlers.setMode(false, false); // senior=false, after=false
      const result = handlers.shouldAskQuestion();

      expect(result.shouldAsk).toBe(false);
      expect(result.reason).toContain('off');
    });
  });

  describe('getConceptLevel', () => {
    it('should create new concept with level 3 (mid-level default)', () => {
      const result = handlers.getConceptLevel('test-concept');

      expect(result.conceptId).toBe('test-concept');
      expect(result.currentLevel).toBe(3); // Default is 3 to respect experienced developers
      expect(result.totalAttempts).toBe(0);
    });

    it('should normalize concept ID', () => {
      const result = handlers.getConceptLevel('Test Concept');

      expect(result.conceptId).toBe('test-concept');
    });
  });

  describe('recordLearning', () => {
    it('should record correct answer', () => {
      handlers.getConceptLevel('test-concept');
      const result = handlers.recordLearning('test-concept', 3, 'correct');

      expect(result.recorded).toBe(true);
      expect(result.message).toContain('Correct');
    });

    it('should increment skips for skipped', () => {
      handlers.getConceptLevel('test-concept');
      const result = handlers.recordLearning('test-concept', 3, 'skipped');

      expect(result.recorded).toBe(true);
      expect(result.consecutiveSkips).toBe(1);
    });

    it('should level up after consecutive correct answers', () => {
      handlers.getConceptLevel('test-concept');

      // Need 2 correct answers to level up (CORRECT_TO_LEVEL_UP = 2)
      handlers.recordLearning('test-concept', 3, 'correct');
      const result = handlers.recordLearning('test-concept', 3, 'correct');

      expect(result.newLevel).toBeGreaterThanOrEqual(3);
    });

    it('should level down on incorrect answer', () => {
      handlers.getConceptLevel('test-concept'); // Starts at level 3
      const result = handlers.recordLearning('test-concept', 3, 'incorrect');

      expect(result.recorded).toBe(true);
      expect(result.newLevel).toBe(2); // Immediate level down
    });

    it('should not change level for partial', () => {
      handlers.getConceptLevel('test-concept'); // Starts at level 3
      const result = handlers.recordLearning('test-concept', 3, 'partial');

      expect(result.recorded).toBe(true);
      expect(result.newLevel).toBe(3); // Level unchanged
    });
  });

  describe('getStats', () => {
    it('should return empty stats initially', () => {
      const result = handlers.getStats('month');

      expect(result.summary.totalConcepts).toBe(0);
      expect(result.byConcept).toHaveLength(0);
    });

    it('should include recorded concepts', () => {
      handlers.getConceptLevel('test-concept');
      handlers.recordLearning('test-concept', 1, 'correct');

      const result = handlers.getStats('month');

      expect(result.summary.totalConcepts).toBe(1);
    });
  });

  describe('getReportData', () => {
    it('should return report data', () => {
      const result = handlers.getReportData('week');

      expect(result.period).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.weakAreas).toBeDefined();
      expect(result.strongAreas).toBeDefined();
    });
  });

  describe('getUnknownUnknowns', () => {
    it('should return empty list initially', () => {
      const result = handlers.getUnknownUnknowns('month');

      expect(result.unknowns).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should include recorded unknowns', () => {
      handlers.recordUnknownUnknown('cache-stampede', 'cache-aside', 'Redis caching', 'Important for scale');

      const result = handlers.getUnknownUnknowns('month');

      expect(result.unknowns).toHaveLength(1);
      expect(result.unknowns[0]?.conceptId).toBe('cache-stampede');
    });
  });

  describe('recordUnknownUnknown', () => {
    it('should record new unknown', () => {
      const result = handlers.recordUnknownUnknown('cache-stampede', 'cache-aside', 'Redis caching', 'DB overload risk');

      expect(result.recorded).toBe(true);
      expect(result.isNew).toBe(true);
      expect(result.appearances).toBe(1);
    });

    it('should increment appearances for existing', () => {
      handlers.recordUnknownUnknown('cache-stampede', 'cache-aside', 'Context 1', 'Reason 1');
      const result = handlers.recordUnknownUnknown('cache-stampede', 'cache-aside', 'Context 2', 'Reason 2');

      expect(result.isNew).toBe(false);
      expect(result.appearances).toBe(2);
    });
  });

  describe('markExplored', () => {
    it('should mark unknown as explored', () => {
      handlers.recordUnknownUnknown('cache-stampede', 'cache-aside', 'Test', 'Test');
      const result = handlers.markExplored('cache-stampede');

      expect(result.updated).toBe(true);
    });

    it('should return updated=false for non-existent', () => {
      const result = handlers.markExplored('non-existent');

      expect(result.updated).toBe(false);
    });
  });

  describe('getDueReviews', () => {
    it('should return empty list initially', () => {
      const result = handlers.getDueReviews();

      expect(result.reviews).toHaveLength(0);
      expect(result.totalDue).toBe(0);
    });
  });

  describe('getMode / setMode', () => {
    it('should return default mode with both toggles enabled', () => {
      const result = handlers.getMode();

      expect(result.seniorEnabled).toBe(true);
      expect(result.afterEnabled).toBe(true);
    });

    it('should update senior toggle independently', () => {
      const result = handlers.setMode(false, undefined);

      expect(result.updated).toBe(true);
      expect(result.seniorEnabled).toBe(false);
      expect(result.afterEnabled).toBe(true);
    });

    it('should update after toggle independently', () => {
      const result = handlers.setMode(undefined, false);

      expect(result.updated).toBe(true);
      expect(result.seniorEnabled).toBe(true);
      expect(result.afterEnabled).toBe(false);
    });

    it('should persist mode changes', () => {
      handlers.setMode(false, false);
      const result = handlers.getMode();

      expect(result.seniorEnabled).toBe(false);
      expect(result.afterEnabled).toBe(false);
    });

    it('should set pause until', () => {
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const result = handlers.setMode(undefined, undefined, future);

      expect(result.updated).toBe(true);
      expect(result.pausedUntil).toBeDefined();
    });

    it('should set focus area', () => {
      const result = handlers.setMode(undefined, undefined, undefined, 'caching');

      expect(result.updated).toBe(true);
      expect(result.focusArea).toBe('caching');
    });

    it('should return no changes when nothing specified', () => {
      const result = handlers.setMode();

      expect(result.updated).toBe(false);
      expect(result.message).toContain('No changes');
    });

    it('should clear focus area', () => {
      handlers.setMode(undefined, undefined, undefined, 'caching');
      const result = handlers.setMode(undefined, undefined, undefined, null);

      expect(result.updated).toBe(true);
    });
  });

  describe('saveReport', () => {
    it('should save report to file', () => {
      // Create some data first
      handlers.getConceptLevel('test-concept');
      handlers.recordLearning('test-concept', 3, 'correct');

      const result = handlers.saveReport('week');

      expect(result.saved).toBe(true);
      expect(result.filePath).toBeDefined();
      expect(result.message).toContain('saved');

      // Clean up the file
      if (fs.existsSync(result.filePath)) {
        fs.unlinkSync(result.filePath);
      }
    });

    it('should use custom filename', () => {
      const result = handlers.saveReport('week', undefined, 'custom-report.md');

      expect(result.filePath).toContain('custom-report.md');

      // Clean up
      if (fs.existsSync(result.filePath)) {
        fs.unlinkSync(result.filePath);
      }
    });
  });

  describe('saveUnknowns', () => {
    it('should save unknowns to file', () => {
      // Create some data
      handlers.recordUnknownUnknown('concept-1', 'related-1', 'ctx', 'imp');

      const result = handlers.saveUnknowns('month', 10);

      expect(result.saved).toBe(true);
      expect(result.filePath).toBeDefined();
      expect(result.count).toBeGreaterThanOrEqual(0);

      // Clean up
      if (fs.existsSync(result.filePath)) {
        fs.unlinkSync(result.filePath);
      }
    });

    it('should use custom filename', () => {
      const result = handlers.saveUnknowns('month', 10, 'custom-unknowns.md');

      expect(result.filePath).toContain('custom-unknowns.md');

      // Clean up
      if (fs.existsSync(result.filePath)) {
        fs.unlinkSync(result.filePath);
      }
    });
  });

  describe('getToolHandlers singleton', () => {
    it('should return same instance', async () => {
      const { getToolHandlers } = await import('../../src/tools/index.js');

      const instance1 = getToolHandlers();
      const instance2 = getToolHandlers();

      expect(instance1).toBe(instance2);
    });
  });
});
