#!/usr/bin/env node
/**
 * VibeLearning CLI
 *
 * Command-line interface for hook integration.
 * Used by shell hooks to check learning status without MCP.
 */

import { FatigueService } from './services/fatigue.service.js';
import { ModeService } from './services/mode.service.js';
import { StatsService } from './services/stats.service.js';
import { LearningService } from './services/learning.service.js';
import {
  SessionStateRepository,
  ModeStateRepository,
  ConceptProgressRepository,
  LearningRecordRepository,
} from './db/repositories/index.js';

const command = process.argv[2];

async function main() {
  switch (command) {
    case 'should-ask': {
      const sessionRepo = new SessionStateRepository();
      const modeRepo = new ModeStateRepository();
      const fatigueService = new FatigueService(sessionRepo);
      const modeService = new ModeService(modeRepo);

      const mode = modeService.getMode();

      // Don't ask if both modes are off
      if (!mode.seniorEnabled && !mode.afterEnabled) {
        console.log(JSON.stringify({ shouldAsk: false, reason: 'Learning mode is off' }));
        process.exit(0);
      }

      // Check if paused
      if (mode.pausedUntil && new Date(mode.pausedUntil) > new Date()) {
        console.log(JSON.stringify({ shouldAsk: false, reason: 'Learning is paused' }));
        process.exit(0);
      }

      const result = fatigueService.shouldAskQuestion();
      console.log(JSON.stringify(result));
      process.exit(result.shouldAsk ? 0 : 1);
    }

    case 'get-mode': {
      const modeRepo = new ModeStateRepository();
      const modeService = new ModeService(modeRepo);
      const mode = modeService.getMode();
      console.log(JSON.stringify(mode));
      process.exit(0);
    }

    case 'get-random-concept': {
      const progressRepo = new ConceptProgressRepository();
      const recordRepo = new LearningRecordRepository();
      const statsService = new StatsService(progressRepo, recordRepo);

      // Get concepts that need review or are weak
      const dueReviews = new LearningService(
        progressRepo,
        recordRepo,
        new SessionStateRepository()
      ).getDueReviews(5);

      const dueReview = dueReviews[0];
      if (dueReview) {
        // Return a concept that's due for review
        console.log(JSON.stringify({
          conceptId: dueReview.conceptId,
          level: dueReview.currentLevel,
          source: 'due-review'
        }));
        process.exit(0);
      }

      // Otherwise get a weak concept
      const weakConcepts = statsService.getWeakConcepts('month', 5);
      const weakConcept = weakConcepts[0];
      if (weakConcept) {
        console.log(JSON.stringify({
          conceptId: weakConcept.conceptId,
          level: weakConcept.currentLevel,
          source: 'weak-concept'
        }));
        process.exit(0);
      }

      // No concepts to review
      console.log(JSON.stringify({ conceptId: null, source: 'none' }));
      process.exit(1);
    }

    case 'stats': {
      const progressRepo = new ConceptProgressRepository();
      const recordRepo = new LearningRecordRepository();
      const statsService = new StatsService(progressRepo, recordRepo);
      const stats = statsService.getStats('month');
      console.log(JSON.stringify(stats));
      process.exit(0);
    }

    default:
      console.error(`Usage: vibe-learning-cli <command>

Commands:
  should-ask        Check if learning question should be asked (exit 0 = yes)
  get-mode          Get current learning mode
  get-random-concept  Get a concept for review
  stats             Get learning statistics
`);
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
