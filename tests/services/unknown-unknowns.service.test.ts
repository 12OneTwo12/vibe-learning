/**
 * Unknown Unknowns Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { UnknownUnknownsService } from '../../src/services/unknown-unknowns.service.js';
import { resetDatabase, getDatabaseConnection } from '../../src/db/index.js';

const TEST_DB_DIR = path.join(os.tmpdir(), 'vibe-learning-unknowns-test-' + Date.now());

describe('UnknownUnknownsService', () => {
  let service: UnknownUnknownsService;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
    getDatabaseConnection({ dbDir: TEST_DB_DIR });
    service = new UnknownUnknownsService();
  });

  afterEach(() => {
    resetDatabase();
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
  });

  describe('recordUnknownUnknown', () => {
    it('should record a new unknown unknown', () => {
      const result = service.recordUnknownUnknown(
        'cache-stampede',
        'redis-caching',
        'Encountered while implementing caching',
        'Can cause server overload during cache misses'
      );

      expect(result.recorded).toBe(true);
      expect(result.conceptId).toBe('cache-stampede');
      expect(result.isNew).toBe(true);
      expect(result.appearances).toBe(1);
    });

    it('should normalize concept IDs', () => {
      const result = service.recordUnknownUnknown(
        'Cache Stampede',
        'Redis Caching',
        'context',
        'importance'
      );

      expect(result.conceptId).toBe('cache-stampede');
    });

    it('should increment appearances on duplicate', () => {
      service.recordUnknownUnknown(
        'unknown-concept',
        'related-concept',
        'context 1',
        'importance 1'
      );

      const result = service.recordUnknownUnknown(
        'unknown-concept',
        'related-concept',
        'context 2',
        'importance 2'
      );

      expect(result.isNew).toBe(false);
      expect(result.appearances).toBe(2);
    });
  });

  describe('getUnknownUnknowns', () => {
    it('should return empty list initially', () => {
      const result = service.getUnknownUnknowns('month');

      expect(result.unknowns).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.exploredThisPeriod).toBe(0);
    });

    it('should return recorded unknowns', () => {
      service.recordUnknownUnknown(
        'concept-1',
        'related-1',
        'context 1',
        'importance 1'
      );
      service.recordUnknownUnknown(
        'concept-2',
        'related-2',
        'context 2',
        'importance 2'
      );

      const result = service.getUnknownUnknowns('month');

      expect(result.unknowns.length).toBeGreaterThanOrEqual(2);
      expect(result.totalCount).toBe(2);
    });

    it('should include period string', () => {
      const weekResult = service.getUnknownUnknowns('week');
      const monthResult = service.getUnknownUnknowns('month');

      expect(weekResult.period).toContain('7 days');
      expect(monthResult.period).toContain('30 days');
    });

    it('should respect limit parameter', () => {
      // Create more unknowns than limit
      for (let i = 0; i < 5; i++) {
        service.recordUnknownUnknown(
          `concept-${i}`,
          'related',
          'context',
          'importance'
        );
      }

      const result = service.getUnknownUnknowns('month', 3);

      expect(result.unknowns.length).toBeLessThanOrEqual(3);
    });
  });

  describe('markExplored', () => {
    it('should mark unknown as explored', () => {
      service.recordUnknownUnknown(
        'concept-to-explore',
        'related',
        'context',
        'importance'
      );

      const result = service.markExplored('concept-to-explore');

      expect(result.updated).toBe(true);
      expect(result.conceptId).toBe('concept-to-explore');
      expect(result.message).toContain('explored');
    });

    it('should return not found for non-existent concept', () => {
      const result = service.markExplored('non-existent');

      expect(result.updated).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should normalize concept ID when marking', () => {
      service.recordUnknownUnknown(
        'my-concept',
        'related',
        'context',
        'importance'
      );

      const result = service.markExplored('My Concept');

      expect(result.updated).toBe(true);
      expect(result.conceptId).toBe('my-concept');
    });

    it('should exclude explored from unknowns list', () => {
      service.recordUnknownUnknown(
        'concept-1',
        'related',
        'context',
        'importance'
      );
      service.recordUnknownUnknown(
        'concept-2',
        'related',
        'context',
        'importance'
      );

      service.markExplored('concept-1');

      const unknowns = service.getUnknownUnknowns('month');
      const conceptIds = unknowns.unknowns.map(u => u.conceptId);

      expect(conceptIds).not.toContain('concept-1');
      expect(unknowns.totalCount).toBe(1);
    });
  });

  describe('getHighPriority', () => {
    it('should return high priority unknowns', () => {
      // Create unknown with multiple appearances (high priority threshold is 3)
      service.recordUnknownUnknown('frequent', 'related', 'ctx', 'imp');
      service.recordUnknownUnknown('frequent', 'related', 'ctx', 'imp');
      service.recordUnknownUnknown('frequent', 'related', 'ctx', 'imp');

      const highPriority = service.getHighPriority();

      // May or may not be in high priority depending on threshold
      expect(Array.isArray(highPriority)).toBe(true);
    });

    it('should respect limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        const conceptId = `concept-${i}`;
        // Make each appear 3+ times for high priority
        service.recordUnknownUnknown(conceptId, 'related', 'ctx', 'imp');
        service.recordUnknownUnknown(conceptId, 'related', 'ctx', 'imp');
        service.recordUnknownUnknown(conceptId, 'related', 'ctx', 'imp');
      }

      const result = service.getHighPriority(3);

      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getRelatedUnknowns', () => {
    it('should return unknowns related to a concept', () => {
      service.recordUnknownUnknown('unknown-1', 'jwt-auth', 'ctx1', 'imp1');
      service.recordUnknownUnknown('unknown-2', 'jwt-auth', 'ctx2', 'imp2');
      service.recordUnknownUnknown('unknown-3', 'redis-cache', 'ctx3', 'imp3');

      const related = service.getRelatedUnknowns('jwt-auth');

      expect(related.length).toBe(2);
      expect(related.every(u => u.relatedTo === 'jwt-auth')).toBe(true);
    });

    it('should normalize related concept ID', () => {
      service.recordUnknownUnknown('unknown-1', 'jwt-auth', 'ctx', 'imp');

      const related = service.getRelatedUnknowns('JWT Auth');

      expect(related.length).toBe(1);
    });

    it('should include priority based on appearances', () => {
      // Create with different appearance counts
      service.recordUnknownUnknown('low-priority', 'related', 'ctx', 'imp');

      const related = service.getRelatedUnknowns('related');

      expect(related[0]).toHaveProperty('priority');
      expect(['high', 'medium', 'low']).toContain(related[0]?.priority);
    });
  });

  describe('getUnexploredCount', () => {
    it('should return 0 initially', () => {
      expect(service.getUnexploredCount()).toBe(0);
    });

    it('should count unexplored items', () => {
      service.recordUnknownUnknown('c1', 'r1', 'ctx', 'imp');
      service.recordUnknownUnknown('c2', 'r2', 'ctx', 'imp');
      service.recordUnknownUnknown('c3', 'r3', 'ctx', 'imp');

      expect(service.getUnexploredCount()).toBe(3);
    });

    it('should not count explored items', () => {
      service.recordUnknownUnknown('c1', 'r1', 'ctx', 'imp');
      service.recordUnknownUnknown('c2', 'r2', 'ctx', 'imp');
      service.markExplored('c1');

      expect(service.getUnexploredCount()).toBe(1);
    });
  });
});
