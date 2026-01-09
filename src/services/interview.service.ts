/**
 * Interview Service
 *
 * Provides interview preparation data based on learning history.
 * Helps users practice technical concepts they've implemented.
 */

import type {
  TimePeriod,
  GetInterviewDataResponse,
  InterviewTopicResponse,
} from '../types/index.js';
import {
  ConceptProgressRepository,
  LearningRecordRepository,
} from '../db/index.js';
import { calculateRate, average, groupBy } from '../core/utils.js';

/**
 * Interview behavior instructions for host LLM
 */
const INTERVIEW_BEHAVIOR = `You are conducting a technical interview practice session.

## How to Use Interview Data

The get_interview_data tool returns:
- topics: Areas the user has practiced, sorted by mastery (weakest first)
- recommendedTopic: Suggested area to practice (usually the weakest)
- Each topic includes: implementations count, mastery %, concepts list

## Interview Flow

1. **Present Topics**: Show available areas with mastery levels
   Format:
   "**[VibeLearning Interview Prep]**

   Technical Areas:
   • {area1} - {implementations} implementations, {mastery}% mastery
   • {area2} - {implementations} implementations, {mastery}% mastery {← Weak area if isWeak}

   Which area would you like to practice?"

2. **Generate Question**: Based on user's selection:
   - Pick a concept from that area's concepts list
   - Ask a behavioral/technical question like:
     "You implemented {concept}. Walk me through:
     - Why did you choose this approach?
     - What tradeoffs did you consider?
     - What would you do differently at scale?"

3. **Evaluate & Coach**: After user answers:
   - Acknowledge good points
   - Suggest improvements for stronger answers
   - Mention what interviewers look for (the "why", tradeoffs, real-world experience)

4. **Record Learning**: Call record_learning with the concept and result

## Question Style

Ask questions that test understanding, not just recall:
- "Walk me through your decision process for..."
- "What happens if X fails? How would you handle it?"
- "Compare this to alternative approaches. Why this one?"
- "How would this change with 10x more traffic?"

## Tone

Be encouraging but constructive. This is practice, not a test.
- Good: "Strong point about X! To make it even better, mention Y."
- Avoid: "Wrong. The correct answer is..."`;

/**
 * Service for interview preparation features
 */
export class InterviewService {
  private readonly progressRepo: ConceptProgressRepository;
  private readonly recordRepo: LearningRecordRepository;

  constructor(
    progressRepo?: ConceptProgressRepository,
    recordRepo?: LearningRecordRepository
  ) {
    this.progressRepo = progressRepo ?? new ConceptProgressRepository();
    this.recordRepo = recordRepo ?? new LearningRecordRepository();
  }

  /**
   * Gets interview preparation data with topics and mastery levels
   */
  getInterviewData(period: TimePeriod = 'month'): GetInterviewDataResponse {
    const aggregates = this.recordRepo.getAggregateStatsByPeriod(period);

    if (aggregates.length === 0) {
      return {
        topics: [],
        recommendedTopic: null,
        totalConcepts: 0,
        formattedOutput: this.formatNoDataOutput(),
        interviewBehavior: INTERVIEW_BEHAVIOR,
      };
    }

    // Pre-fetch all progress data to avoid N+1 queries
    const allProgress = this.progressRepo.getAll();
    const progressMap = new Map(allProgress.map((p) => [p.conceptId, p]));

    // Group concepts by area
    const grouped = groupBy(aggregates, (a) => this.extractArea(a.conceptId));

    // Build topic data
    const topics: InterviewTopicResponse[] = [];

    for (const [area, concepts] of Object.entries(grouped)) {
      const totalAttempts = concepts.reduce((sum, c) => sum + c.totalAttempts, 0);
      const totalCorrect = concepts.reduce((sum, c) => sum + c.correctCount, 0);
      const totalSkipped = concepts.reduce((sum, c) => sum + c.skippedCount, 0);

      const correctRate = calculateRate(totalCorrect, totalAttempts - totalSkipped);

      const levels = concepts.map((c) => {
        const progress = progressMap.get(c.conceptId);
        return progress?.currentLevel ?? 1;
      });
      const avgLevel = average(levels);

      // Mastery = (correctRate * 0.6 + normalizedLevel * 0.4) * 100
      // normalizedLevel = avgLevel / 5
      const mastery = Math.round((correctRate * 0.6 + (avgLevel / 5) * 0.4) * 100);

      // Area is weak if mastery < 60% or avgLevel < 2.5
      const isWeak = mastery < 60 || avgLevel < 2.5;

      topics.push({
        area,
        implementations: totalAttempts,
        mastery,
        isWeak,
        concepts: concepts.map((c) => c.conceptId),
        avgLevel: Number(avgLevel.toFixed(1)),
        correctRate: Number(correctRate.toFixed(2)),
      });
    }

    // Sort by mastery (weakest first for recommendations)
    topics.sort((a, b) => a.mastery - b.mastery);

    // Recommend the weakest area with at least 2 implementations
    const recommendedTopic = topics.find((t) => t.implementations >= 2)?.area ?? null;

    const baseResult = {
      topics,
      recommendedTopic,
      totalConcepts: aggregates.length,
      interviewBehavior: INTERVIEW_BEHAVIOR,
    };

    return {
      ...baseResult,
      formattedOutput: this.formatOutput(baseResult),
    };
  }

  /**
   * Gets weak topics for focused practice
   */
  getWeakTopics(limit = 3): readonly InterviewTopicResponse[] {
    const data = this.getInterviewData('month');
    return data.topics.filter((t) => t.isWeak).slice(0, limit);
  }

  /**
   * Gets strong topics (for confidence building)
   */
  getStrongTopics(limit = 3): readonly InterviewTopicResponse[] {
    const data = this.getInterviewData('month');
    return [...data.topics]
      .filter((t) => !t.isWeak)
      .sort((a, b) => b.mastery - a.mastery)
      .slice(0, limit);
  }

  /**
   * Extracts area from concept ID
   */
  private extractArea(conceptId: string): string {
    const parts = conceptId.split(/[-_]/);
    return parts[0] ?? 'general';
  }

  /**
   * Formats output for display
   */
  private formatOutput(data: Omit<GetInterviewDataResponse, 'formattedOutput'>): string {
    const lines: string[] = [];

    lines.push('**[VibeLearning Interview Prep]**');
    lines.push('');
    lines.push('Technical Areas:');

    for (const topic of data.topics) {
      const weakMarker = topic.isWeak ? ' ← Weak area' : '';
      lines.push(`• ${topic.area} - ${topic.implementations} implementations, ${topic.mastery}% mastery${weakMarker}`);
    }

    lines.push('');

    if (data.recommendedTopic) {
      lines.push(`💡 Recommended: Practice **${data.recommendedTopic}** to strengthen your weak areas.`);
    }

    lines.push('');
    lines.push('Which area would you like to practice?');

    return lines.join('\n');
  }

  /**
   * Formats output when no data available
   */
  private formatNoDataOutput(): string {
    return `**[VibeLearning Interview Prep]**

No learning data yet. Start by completing some coding tasks and answering learning questions.

Once you have practiced a few concepts, you can use interview prep to:
• Review areas you've worked on
• Practice explaining your implementation decisions
• Prepare for technical interviews`;
  }
}
