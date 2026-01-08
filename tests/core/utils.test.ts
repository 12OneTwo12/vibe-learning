/**
 * Utility Functions Tests
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeConceptId,
  formatDateString,
  daysBetween,
  minutesBetween,
  addDays,
  addHours,
  isDatePast,
  clampLevel,
  calculatePercentage,
  calculateRate,
  formatChange,
  groupBy,
  average,
} from '../../src/core/utils.js';

describe('Utility Functions', () => {
  describe('normalizeConceptId', () => {
    it('should convert to lowercase', () => {
      expect(normalizeConceptId('CacheAside')).toBe('cacheaside');
    });

    it('should replace spaces with hyphens', () => {
      expect(normalizeConceptId('cache aside')).toBe('cache-aside');
    });

    it('should remove special characters', () => {
      expect(normalizeConceptId('cache@aside!')).toBe('cacheaside');
    });

    it('should handle multiple hyphens', () => {
      expect(normalizeConceptId('cache--aside')).toBe('cache-aside');
    });

    it('should trim whitespace', () => {
      expect(normalizeConceptId('  cache aside  ')).toBe('cache-aside');
    });

    it('should handle Korean characters', () => {
      expect(normalizeConceptId('캐시 전략')).toBe('캐시-전략');
    });
  });

  describe('formatDateString', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2026-01-15T10:30:00Z');
      expect(formatDateString(date)).toBe('2026-01-15');
    });
  });

  describe('daysBetween', () => {
    it('should calculate days between dates', () => {
      const date1 = new Date('2026-01-01');
      const date2 = new Date('2026-01-10');
      expect(daysBetween(date1, date2)).toBe(9);
    });

    it('should return 0 for same day', () => {
      const date = new Date('2026-01-01');
      expect(daysBetween(date, date)).toBe(0);
    });

    it('should handle reverse order', () => {
      const date1 = new Date('2026-01-10');
      const date2 = new Date('2026-01-01');
      expect(daysBetween(date1, date2)).toBe(9);
    });
  });

  describe('minutesBetween', () => {
    it('should calculate minutes between dates', () => {
      const date1 = new Date('2026-01-01T10:00:00');
      const date2 = new Date('2026-01-01T10:30:00');
      expect(minutesBetween(date1, date2)).toBe(30);
    });
  });

  describe('addDays', () => {
    it('should add days to date', () => {
      const date = new Date('2026-01-01');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(6);
    });

    it('should not modify original date', () => {
      const date = new Date('2026-01-01');
      addDays(date, 5);
      expect(date.getDate()).toBe(1);
    });
  });

  describe('addHours', () => {
    it('should add hours to date', () => {
      const date = new Date('2026-01-01T10:00:00');
      const result = addHours(date, 3);
      expect(result.getHours()).toBe(13);
    });
  });

  describe('isDatePast', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(isDatePast(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date('2030-01-01');
      expect(isDatePast(futureDate)).toBe(false);
    });
  });

  describe('clampLevel', () => {
    it('should return level within range', () => {
      expect(clampLevel(3)).toBe(3);
    });

    it('should clamp to minimum', () => {
      expect(clampLevel(0)).toBe(1);
    });

    it('should clamp to maximum', () => {
      expect(clampLevel(10)).toBe(5);
    });

    it('should round to nearest integer', () => {
      expect(clampLevel(2.7)).toBe(3);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage', () => {
      expect(calculatePercentage(75, 100)).toBe(75);
    });

    it('should handle zero denominator', () => {
      expect(calculatePercentage(10, 0)).toBe(0);
    });

    it('should respect decimal places', () => {
      expect(calculatePercentage(1, 3, 1)).toBe(33.3);
    });
  });

  describe('calculateRate', () => {
    it('should calculate rate', () => {
      expect(calculateRate(3, 4)).toBe(0.75);
    });

    it('should handle zero denominator', () => {
      expect(calculateRate(10, 0)).toBe(0);
    });
  });

  describe('formatChange', () => {
    it('should format positive change with +', () => {
      expect(formatChange(10, 8)).toBe('+2.0');
    });

    it('should format negative change with -', () => {
      expect(formatChange(8, 10)).toBe('-2.0');
    });

    it('should format zero change', () => {
      expect(formatChange(10, 10)).toBe('+0.0');
    });
  });

  describe('groupBy', () => {
    it('should group items by key', () => {
      const items = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 },
      ];
      const grouped = groupBy(items, (item) => item.type);

      expect(grouped['a']).toHaveLength(2);
      expect(grouped['b']).toHaveLength(1);
    });
  });

  describe('average', () => {
    it('should calculate average', () => {
      expect(average([1, 2, 3, 4, 5])).toBe(3);
    });

    it('should return 0 for empty array', () => {
      expect(average([])).toBe(0);
    });
  });
});
