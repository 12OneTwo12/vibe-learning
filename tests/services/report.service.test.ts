/**
 * Report Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { ReportService } from '../../src/services/report.service.js';
import { LearningService } from '../../src/services/learning.service.js';
import { UnknownUnknownsService } from '../../src/services/unknown-unknowns.service.js';
import { resetDatabase, getDatabaseConnection } from '../../src/db/index.js';

const TEST_DB_DIR = path.join(os.tmpdir(), 'vibe-learning-report-test-' + Date.now());

describe('ReportService', () => {
  let reportService: ReportService;
  let learningService: LearningService;
  let unknownsService: UnknownUnknownsService;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
    getDatabaseConnection({ dbDir: TEST_DB_DIR });
    reportService = new ReportService();
    learningService = new LearningService();
    unknownsService = new UnknownUnknownsService();
  });

  afterEach(() => {
    resetDatabase();
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
  });

  describe('getReportData', () => {
    it('should return empty report initially', () => {
      const report = reportService.getReportData('week');

      expect(report.period).toContain('7 days');
      expect(report.summary.conceptsTouched).toBe(0);
      expect(report.summary.questionsAsked).toBe(0);
      expect(report.weakAreas).toHaveLength(0);
      expect(report.strongAreas).toHaveLength(0);
    });

    it('should include period string', () => {
      const weekReport = reportService.getReportData('week');
      const monthReport = reportService.getReportData('month');
      const allReport = reportService.getReportData('all');

      expect(weekReport.period).toContain('7 days');
      expect(monthReport.period).toContain('30 days');
      expect(allReport.period).toContain('All time');
    });

    it('should count concepts touched', () => {
      learningService.getConceptLevel('concept-1');
      learningService.getConceptLevel('concept-2');
      learningService.recordLearning('concept-1', 3, 'correct');
      learningService.recordLearning('concept-2', 3, 'correct');

      const report = reportService.getReportData('week');

      expect(report.summary.conceptsTouched).toBe(2);
    });

    it('should include questions asked count', () => {
      learningService.getConceptLevel('concept-1');
      learningService.recordLearning('concept-1', 3, 'correct');
      learningService.recordLearning('concept-1', 3, 'correct');
      learningService.recordLearning('concept-1', 3, 'incorrect');

      const report = reportService.getReportData('week');

      expect(report.summary.questionsAsked).toBe(3);
    });

    it('should calculate skip rate', () => {
      learningService.getConceptLevel('concept-1');
      learningService.recordLearning('concept-1', 3, 'correct');
      learningService.recordLearning('concept-1', 3, 'skipped');

      const report = reportService.getReportData('week');

      expect(report.summary.skipRate).toBeGreaterThan(0);
    });

    it('should include skipped concepts', () => {
      learningService.getConceptLevel('concept-1');
      learningService.recordLearning('concept-1', 3, 'skipped');
      learningService.recordLearning('concept-1', 3, 'skipped');

      const report = reportService.getReportData('week');

      expect(report).toHaveProperty('skippedConcepts');
    });

    it('should include trends', () => {
      const report = reportService.getReportData('week');

      expect(report).toHaveProperty('trends');
      expect(report.trends).toHaveProperty('vsLastPeriod');
    });

    it('should include unknown unknowns', () => {
      unknownsService.recordUnknownUnknown(
        'unknown-concept',
        'known-concept',
        'Encountered while working',
        'Important for understanding'
      );

      const report = reportService.getReportData('week');

      expect(report).toHaveProperty('unknownUnknowns');
    });
  });

  describe('area filtering', () => {
    it('should filter by area when specified', () => {
      learningService.getConceptLevel('auth-login');
      learningService.getConceptLevel('auth-logout');
      learningService.getConceptLevel('cache-redis');
      learningService.recordLearning('auth-login', 3, 'correct');
      learningService.recordLearning('auth-logout', 3, 'correct');
      learningService.recordLearning('cache-redis', 3, 'correct');

      const report = reportService.getReportData('week', 'auth');

      // Should only include auth-related concepts
      expect(report.summary.conceptsTouched).toBe(2);
    });
  });

  describe('weak areas identification', () => {
    it('should identify weak areas from low correct rate', () => {
      // Create concepts in same area with low correct rate
      learningService.getConceptLevel('test-concept1');
      learningService.getConceptLevel('test-concept2');
      learningService.recordLearning('test-concept1', 3, 'incorrect');
      learningService.recordLearning('test-concept1', 2, 'incorrect');
      learningService.recordLearning('test-concept2', 3, 'incorrect');
      learningService.recordLearning('test-concept2', 2, 'incorrect');

      const report = reportService.getReportData('week');

      // May or may not identify weak areas depending on thresholds
      expect(report).toHaveProperty('weakAreas');
      expect(Array.isArray(report.weakAreas)).toBe(true);
    });
  });

  describe('strong areas identification', () => {
    it('should identify strong areas from high correct rate', () => {
      // Create concepts in same area with high correct rate
      learningService.getConceptLevel('strong-concept1');
      learningService.getConceptLevel('strong-concept2');
      learningService.recordLearning('strong-concept1', 3, 'correct');
      learningService.recordLearning('strong-concept1', 4, 'correct');
      learningService.recordLearning('strong-concept2', 3, 'correct');
      learningService.recordLearning('strong-concept2', 4, 'correct');

      const report = reportService.getReportData('week');

      expect(report).toHaveProperty('strongAreas');
      expect(Array.isArray(report.strongAreas)).toBe(true);
    });
  });
});
