/**
 * VibeLearning MCP Server
 *
 * Learning MCP server for AI coding agents.
 * "Learn while vibe coding"
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { getToolHandlers } from './tools/index.js';
import {
  getConceptLevelInputSchema,
  recordLearningInputSchema,
  getStatsInputSchema,
  getReportDataInputSchema,
  getUnknownUnknownsInputSchema,
  recordUnknownUnknownInputSchema,
  markExploredInputSchema,
  getDueReviewsInputSchema,
  setModeInputSchema,
  saveReportInputSchema,
  saveUnknownsInputSchema,
} from './tools/schemas.js';
import { VibeLearningError } from './core/errors.js';
import { closeDatabase } from './db/index.js';
import type { ConceptLevel, LearningResult, TimePeriod } from './types/index.js';

/**
 * Tool definitions for MCP
 */
const TOOLS: Tool[] = [
  {
    name: 'should_ask_question',
    description:
      'CALL THIS AFTER COMPLETING ANY CODING TASK. Checks if now is a good time to ask a learning question. Returns shouldAsk (boolean), pendingReviews, and consecutiveSkips. If shouldAsk is true, proceed to ask a concept question using get_concept_level.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_concept_level',
    description:
      'Get the current learning level (1-5) for a concept from the completed task. Creates the concept if new. Use this after should_ask_question returns shouldAsk=true to determine what level question to ask.',
    inputSchema: {
      type: 'object',
      properties: {
        concept_id: {
          type: 'string',
          description: 'Concept identifier (e.g., "cache-aside", "jwt-auth"). Will be normalized to lowercase with hyphens.',
        },
      },
      required: ['concept_id'],
    },
  },
  {
    name: 'record_learning',
    description:
      'Record the result after asking a learning question. Call this with correct/partial/incorrect/skipped based on user response. Updates SM-2 spaced repetition schedule.',
    inputSchema: {
      type: 'object',
      properties: {
        concept_id: {
          type: 'string',
          description: 'Concept identifier',
        },
        level: {
          type: 'number',
          description: 'Question level (1-5). 1=Recognition, 2=Understanding, 3=Comparison, 4=Edge Cases, 5=Architecture',
          minimum: 1,
          maximum: 5,
        },
        result: {
          type: 'string',
          enum: ['correct', 'partial', 'incorrect', 'skipped'],
          description: 'Learning result. "correct"=understood, "partial"=partially understood, "incorrect"=wrong, "skipped"=user skipped',
        },
      },
      required: ['concept_id', 'level', 'result'],
    },
  },
  {
    name: 'get_stats',
    description:
      'Get learning statistics for a time period. Returns concept count, correct rate, average level, and per-concept breakdown.',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['week', 'month', 'all'],
          description: 'Time period for statistics',
          default: 'month',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_report_data',
    description:
      'Get comprehensive learning report data. Includes weak areas, strong areas, unknown unknowns, trends, and skipped concepts. Host LLM should format this into a human-readable report.',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['week', 'month', 'all'],
          description: 'Report time period',
          default: 'week',
        },
        area: {
          type: 'string',
          description: 'Optional area filter (e.g., "auth", "caching")',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_unknown_unknowns',
    description:
      'Get concepts the user encountered but has not explored yet. These are "unknown unknowns" - things the user does not know they do not know.',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['week', 'month', 'all'],
          description: 'Time period',
          default: 'month',
        },
        limit: {
          type: 'number',
          description: 'Maximum items to return',
          default: 10,
          minimum: 1,
          maximum: 50,
        },
      },
      required: [],
    },
  },
  {
    name: 'record_unknown_unknown',
    description:
      'PROACTIVELY CALL THIS when you notice a related concept the user might not know. Example: while implementing JWT auth, record "refresh-token-rotation" as an unknown unknown.',
    inputSchema: {
      type: 'object',
      properties: {
        concept_id: {
          type: 'string',
          description: 'Unknown concept identifier (e.g., "cache-stampede")',
        },
        related_to: {
          type: 'string',
          description: 'Related known concept (e.g., "cache-aside")',
        },
        context: {
          type: 'string',
          description: 'Context where the concept appeared',
        },
        why_important: {
          type: 'string',
          description: 'Why this concept is important to know',
        },
      },
      required: ['concept_id', 'related_to', 'context', 'why_important'],
    },
  },
  {
    name: 'mark_explored',
    description: 'Mark an unknown unknown as explored after the user has learned about it.',
    inputSchema: {
      type: 'object',
      properties: {
        concept_id: {
          type: 'string',
          description: 'Concept to mark as explored',
        },
      },
      required: ['concept_id'],
    },
  },
  {
    name: 'get_due_reviews',
    description: 'Get concepts that are due for review based on SM-2 spaced repetition schedule.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum reviews to return',
          default: 5,
          minimum: 1,
          maximum: 20,
        },
      },
      required: [],
    },
  },
  {
    name: 'get_mode',
    description:
      'CALL THIS AT THE START OF EVERY IMPLEMENTATION TASK to check current learning mode. Returns seniorEnabled, afterEnabled, and behavior instructions. If seniorEnabled is true, you MUST ask conceptual questions BEFORE writing code.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'set_mode',
    description:
      'Set learning mode toggles independently. senior_enabled=true for pre-implementation questions, after_enabled=true for post-implementation questions. Both default to true. Set both to false for off (recording continues).',
    inputSchema: {
      type: 'object',
      properties: {
        senior_enabled: {
          type: 'boolean',
          description: 'Enable/disable senior mode (pre-implementation conceptual questions)',
        },
        after_enabled: {
          type: 'boolean',
          description: 'Enable/disable after mode (post-implementation spaced repetition questions)',
        },
        paused_until: {
          type: 'string',
          description: 'ISO datetime to pause learning until (optional)',
        },
        focus_area: {
          type: 'string',
          description: 'Area to focus questions on (optional, null to clear)',
        },
      },
      required: [],
    },
  },
  {
    name: 'save_report',
    description:
      'Save learning report to a markdown file. Use for /learn report --save. Saves to ~/.vibe-learning/ directory.',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['week', 'month', 'all'],
          description: 'Report time period',
          default: 'week',
        },
        area: {
          type: 'string',
          description: 'Optional area filter (e.g., "auth", "caching")',
        },
        filename: {
          type: 'string',
          description: 'Custom filename (default: vibe-learning-report-{date}.md)',
        },
      },
      required: [],
    },
  },
  {
    name: 'save_unknowns',
    description:
      'Save unknown unknowns to a markdown file. Use for /learn unknowns --save. Saves to ~/.vibe-learning/ directory.',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['week', 'month', 'all'],
          description: 'Time period',
          default: 'month',
        },
        limit: {
          type: 'number',
          description: 'Maximum items to include',
          default: 20,
          minimum: 1,
          maximum: 50,
        },
        filename: {
          type: 'string',
          description: 'Custom filename (default: vibe-learning-unknowns-{date}.md)',
        },
      },
      required: [],
    },
  },
];

/**
 * Creates and configures the MCP server
 */
function createServer(): Server {
  const server = new Server(
    {
      name: 'vibe-learning',
      version: '0.3.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const handlers = getToolHandlers();

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'should_ask_question': {
          const result = handlers.shouldAskQuestion();
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'get_concept_level': {
          const parsed = getConceptLevelInputSchema.parse(args);
          const result = handlers.getConceptLevel(parsed.concept_id);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'record_learning': {
          const parsed = recordLearningInputSchema.parse(args);
          const result = handlers.recordLearning(
            parsed.concept_id,
            parsed.level as ConceptLevel,
            parsed.result as LearningResult
          );
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'get_stats': {
          const parsed = getStatsInputSchema.parse(args ?? {});
          const result = handlers.getStats(parsed.period as TimePeriod);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'get_report_data': {
          const parsed = getReportDataInputSchema.parse(args ?? {});
          const result = handlers.getReportData(parsed.period as TimePeriod, parsed.area);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'get_unknown_unknowns': {
          const parsed = getUnknownUnknownsInputSchema.parse(args ?? {});
          const result = handlers.getUnknownUnknowns(parsed.period as TimePeriod, parsed.limit);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'record_unknown_unknown': {
          const parsed = recordUnknownUnknownInputSchema.parse(args);
          const result = handlers.recordUnknownUnknown(
            parsed.concept_id,
            parsed.related_to,
            parsed.context,
            parsed.why_important
          );
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'mark_explored': {
          const parsed = markExploredInputSchema.parse(args);
          const result = handlers.markExplored(parsed.concept_id);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'get_due_reviews': {
          const parsed = getDueReviewsInputSchema.parse(args ?? {});
          const result = handlers.getDueReviews(parsed.limit);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'get_mode': {
          const result = handlers.getMode();
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'set_mode': {
          const parsed = setModeInputSchema.parse(args ?? {});
          const result = handlers.setMode(
            parsed.senior_enabled,
            parsed.after_enabled,
            parsed.paused_until,
            parsed.focus_area
          );
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'save_report': {
          const parsed = saveReportInputSchema.parse(args ?? {});
          const result = handlers.saveReport(
            parsed.period as TimePeriod,
            parsed.area,
            parsed.filename
          );
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'save_unknowns': {
          const parsed = saveUnknownsInputSchema.parse(args ?? {});
          const result = handlers.saveUnknowns(
            parsed.period as TimePeriod,
            parsed.limit,
            parsed.filename
          );
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Invalid input parameters',
                details: error.errors,
              }),
            },
          ],
          isError: true,
        };
      }

      if (error instanceof VibeLearningError) {
        return {
          content: [{ type: 'text', text: JSON.stringify(error.toResponse()) }],
          isError: true,
        };
      }

      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              code: 'INTERNAL_ERROR',
              message,
            }),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Starts the MCP server
 * Called from main.ts when `vibe-learning serve` is executed
 */
export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    closeDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    closeDatabase();
    process.exit(0);
  });

  await server.connect(transport);
  console.error('VibeLearning MCP server started');
}
