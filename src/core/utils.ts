/**
 * VibeLearning Utility Functions
 *
 * Common utility functions for date handling, string manipulation,
 * and data transformation.
 */

import type { ConceptLevel, TimePeriod } from '../types/index.js';
import { LEVEL_CONFIG, REPORT_CONFIG } from './constants.js';

/**
 * Normalizes a concept ID to a consistent format
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters except hyphens and underscores
 */
export function normalizeConceptId(conceptId: string): string {
  return conceptId
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣\-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Formats a date to ISO string date part (YYYY-MM-DD)
 */
export function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0] as string;
}

/**
 * Formats a date to ISO string
 */
export function formatISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Parses an ISO date string to Date object
 */
export function parseISOString(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date;
}

/**
 * Gets the start date for a time period
 */
export function getPeriodStartDate(period: TimePeriod): Date {
  const now = new Date();
  switch (period) {
    case 'week':
      return new Date(now.getTime() - REPORT_CONFIG.WEEK_DAYS * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - REPORT_CONFIG.MONTH_DAYS * 24 * 60 * 60 * 1000);
    case 'all':
      return new Date(0); // Unix epoch
  }
}

/**
 * Formats a time period to human-readable string
 */
export function formatPeriodString(period: TimePeriod, startDate: Date): string {
  const endDate = new Date();
  const start = formatDateString(startDate);
  const end = formatDateString(endDate);

  switch (period) {
    case 'week':
      return `${start} ~ ${end} (last 7 days)`;
    case 'month':
      return `${start} ~ ${end} (last 30 days)`;
    case 'all':
      return `All time ~ ${end}`;
  }
}

/**
 * Calculates days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates minutes between two dates
 */
export function minutesBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60));
}

/**
 * Formats a duration in milliseconds to human-readable string
 * Examples: "3s", "1m 30s", "2h 15m", "1d 3h", "1mo 5d"
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (months > 0) {
    const remainingDays = days % 30;
    return remainingDays > 0 ? `${months}mo ${remainingDays}d` : `${months}mo`;
  }
  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Formats duration between two dates to human-readable string
 */
export function formatDurationBetween(date1: Date, date2: Date): string {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return formatDuration(diffTime);
}

/**
 * Adds days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adds hours to a date
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setTime(result.getTime() + hours * 60 * 60 * 1000);
  return result;
}

/**
 * Checks if a date is in the past
 */
export function isDatePast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Clamps a concept level to valid range
 */
export function clampLevel(level: number): ConceptLevel {
  const clamped = Math.max(LEVEL_CONFIG.MIN_LEVEL, Math.min(LEVEL_CONFIG.MAX_LEVEL, Math.round(level)));
  return clamped as ConceptLevel;
}

/**
 * Calculates percentage with optional decimal places
 */
export function calculatePercentage(numerator: number, denominator: number, decimals = 2): number {
  if (denominator === 0) return 0;
  const percentage = (numerator / denominator) * 100;
  return Number(percentage.toFixed(decimals));
}

/**
 * Calculates rate (0-1) with optional decimal places
 */
export function calculateRate(numerator: number, denominator: number, decimals = 2): number {
  if (denominator === 0) return 0;
  const rate = numerator / denominator;
  return Number(rate.toFixed(decimals));
}

/**
 * Formats a change value with + or - prefix
 */
export function formatChange(current: number, previous: number, decimals = 1): string {
  const change = current - previous;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(decimals)}`;
}

/**
 * Groups an array by a key function
 */
export function groupBy<T, K extends string | number>(items: readonly T[], keyFn: (item: T) => K): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}

/**
 * Calculates average of numbers
 */
export function average(numbers: readonly number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Creates a result object with success status
 */
export function success<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

/**
 * Creates an error result object
 */
export function error(code: string, message: string, suggestion?: string): {
  success: false;
  code: string;
  message: string;
  suggestion?: string;
} {
  return suggestion ? { success: false, code, message, suggestion } : { success: false, code, message };
}

/**
 * Type guard for checking if a value is defined
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Safely accesses an array element
 */
export function safeGet<T>(arr: readonly T[], index: number): T | undefined {
  return arr[index];
}
