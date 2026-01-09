/**
 * MCP Tool Input Schemas
 *
 * Zod schemas for validating MCP tool inputs.
 */

import { z } from 'zod';

/**
 * Schema for learning result
 */
export const learningResultSchema = z.enum(['correct', 'partial', 'incorrect', 'skipped']);

/**
 * @deprecated Learning mode schema - kept for backward compatibility
 */
export const learningModeSchema = z.enum(['after', 'before', 'off', 'senior', 'senior_light']);

/**
 * Schema for time period
 */
export const timePeriodSchema = z.enum(['week', 'month', 'all']);

/**
 * Schema for concept level (1-5)
 */
export const conceptLevelSchema = z.number().int().min(1).max(5);

/**
 * Schema for get_concept_level input
 */
export const getConceptLevelInputSchema = z.object({
  concept_id: z.string().min(1).describe('Concept identifier (e.g., "cache-aside", "jwt-auth")'),
});

/**
 * Schema for record_learning input
 */
export const recordLearningInputSchema = z.object({
  concept_id: z.string().min(1).describe('Concept identifier'),
  level: conceptLevelSchema.describe('Question level (1-5)'),
  result: learningResultSchema.describe('Learning result'),
});

/**
 * Schema for get_stats input
 */
export const getStatsInputSchema = z.object({
  period: timePeriodSchema.default('month').describe('Time period for statistics'),
});

/**
 * Schema for get_report_data input
 */
export const getReportDataInputSchema = z.object({
  period: timePeriodSchema.default('week').describe('Time period for report'),
  area: z.string().optional().describe('Optional area filter (e.g., "auth", "caching")'),
});

/**
 * Schema for get_unknown_unknowns input
 */
export const getUnknownUnknownsInputSchema = z.object({
  period: timePeriodSchema.default('month').describe('Time period'),
  limit: z.number().int().min(1).max(50).default(10).describe('Maximum items to return'),
});

/**
 * Schema for record_unknown_unknown input
 */
export const recordUnknownUnknownInputSchema = z.object({
  concept_id: z.string().min(1).describe('Unknown concept identifier'),
  related_to: z.string().min(1).describe('Related known concept'),
  context: z.string().describe('Context where it appeared'),
  why_important: z.string().describe('Why this concept is important'),
});

/**
 * Schema for mark_explored input
 */
export const markExploredInputSchema = z.object({
  concept_id: z.string().min(1).describe('Concept to mark as explored'),
});

/**
 * Schema for get_due_reviews input
 */
export const getDueReviewsInputSchema = z.object({
  limit: z.number().int().min(1).max(20).default(5).describe('Maximum reviews to return'),
});

/**
 * Schema for set_mode input
 * New architecture: independent senior/after toggles
 */
export const setModeInputSchema = z.object({
  senior_enabled: z.boolean().optional().describe('Enable/disable senior mode (pre-implementation questions)'),
  after_enabled: z.boolean().optional().describe('Enable/disable after mode (post-implementation questions)'),
  paused_until: z.string().datetime().optional().describe('ISO datetime to pause until'),
  focus_area: z.string().optional().nullable().describe('Area to focus questions on'),
});

/**
 * Schema for save_report input
 */
export const saveReportInputSchema = z.object({
  period: timePeriodSchema.default('week').describe('Time period for report'),
  area: z.string().optional().describe('Optional area filter'),
  filename: z.string().optional().describe('Custom filename (default: vibe-learning-report-{date}.md)'),
});

/**
 * Schema for save_unknowns input
 */
export const saveUnknownsInputSchema = z.object({
  period: timePeriodSchema.default('month').describe('Time period'),
  limit: z.number().int().min(1).max(50).default(20).describe('Maximum items to include'),
  filename: z.string().optional().describe('Custom filename (default: vibe-learning-unknowns-{date}.md)'),
});

/**
 * Schema for get_interview_data input
 */
export const getInterviewDataInputSchema = z.object({
  period: timePeriodSchema.default('month').describe('Time period for interview data'),
});

/**
 * Type exports from schemas
 */
export type GetConceptLevelInput = z.infer<typeof getConceptLevelInputSchema>;
export type RecordLearningInput = z.infer<typeof recordLearningInputSchema>;
export type GetStatsInput = z.infer<typeof getStatsInputSchema>;
export type GetReportDataInput = z.infer<typeof getReportDataInputSchema>;
export type GetUnknownUnknownsInput = z.infer<typeof getUnknownUnknownsInputSchema>;
export type RecordUnknownUnknownInput = z.infer<typeof recordUnknownUnknownInputSchema>;
export type MarkExploredInput = z.infer<typeof markExploredInputSchema>;
export type GetDueReviewsInput = z.infer<typeof getDueReviewsInputSchema>;
export type SetModeInput = z.infer<typeof setModeInputSchema>;
export type SaveReportInput = z.infer<typeof saveReportInputSchema>;
export type SaveUnknownsInput = z.infer<typeof saveUnknownsInputSchema>;
export type GetInterviewDataInput = z.infer<typeof getInterviewDataInputSchema>;
