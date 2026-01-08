/**
 * VibeLearning OpenCode Plugin
 *
 * Handles /learn commands and auto-learning triggers.
 * New architecture: independent senior/after toggles.
 */

import type { Plugin } from "@opencode-ai/plugin";

const CONFIG = {
  TOOL_THRESHOLD: 3,
  COOLDOWN_MS: 15 * 60 * 1000,
  MAX_CONCEPTS: 10,
  SIGNIFICANT_TOOLS: ["edit", "write", "bash"],
};

let toolCount = 0;
let lastLearningPrompt = 0;
let recentConcepts: string[] = [];

// New mode state: independent toggles
let seniorEnabled = true;
let afterEnabled = true;
let lastSessionID: string | null = null;
let shownToastForSession: string | null = null;

interface ConceptMatch {
  pattern: RegExp | ((s: string) => boolean);
  concept: string;
}

const FILE_CONCEPTS: ConceptMatch[] = [
  { pattern: /test|spec|__tests__/i, concept: "unit-testing" },
  { pattern: /auth|login|session|jwt|oauth/i, concept: "authentication" },
  { pattern: /api|endpoint|route/i, concept: "api-design" },
  { pattern: /cache|redis|memcache/i, concept: "caching" },
  { pattern: /hook|use[A-Z]/i, concept: "react-hooks" },
  { pattern: /\.tsx$|\.jsx$/i, concept: "react-components" },
  { pattern: /db|database|prisma|sequelize|typeorm/i, concept: "database" },
];

const COMMAND_CONCEPTS: ConceptMatch[] = [
  { pattern: (s) => s.includes("git"), concept: "git-workflow" },
  { pattern: (s) => s.includes("docker"), concept: "containerization" },
  { pattern: (s) => /npm test|jest|vitest|mocha/.test(s), concept: "testing" },
];

function extractConcept(tool: string, args: Record<string, unknown>): string | null {
  if (tool === "Edit" || tool === "Write") {
    const filePath = (args.file_path as string) || "";
    for (const { pattern, concept } of FILE_CONCEPTS) {
      if (pattern instanceof RegExp && pattern.test(filePath)) return concept;
    }
  }
  if (tool === "Bash") {
    const cmd = (args.command as string) || "";
    for (const { pattern, concept } of COMMAND_CONCEPTS) {
      if (typeof pattern === "function" && pattern(cmd)) return concept;
    }
  }
  return null;
}

function addConcept(concept: string): void {
  if (!recentConcepts.includes(concept)) {
    recentConcepts.push(concept);
    if (recentConcepts.length > CONFIG.MAX_CONCEPTS) recentConcepts.shift();
  }
}

function extractConceptFromPath(filePath: string): string | null {
  const lower = filePath.toLowerCase();
  for (const { pattern, concept } of FILE_CONCEPTS) {
    if (pattern instanceof RegExp && pattern.test(lower)) return concept;
  }
  return null;
}

// Command prompts with new API
const COMMAND_PROMPTS: Record<string, string> = {
  status: `Execute NOW: Call mcp__vibe-learning__get_mode and mcp__vibe-learning__should_ask_question, then show:
- Senior mode: on/off
- After mode: on/off
- Cooldown status
- Consecutive skips`,

  stats: `Execute NOW: Call mcp__vibe-learning__get_stats with period="month", then format as a dashboard showing:
- Total concepts learned
- Correct rate percentage
- Average level
- Per-concept breakdown`,

  report: `Execute NOW: Call mcp__vibe-learning__get_report_data with period="week", then format as a report with:
- Summary
- Weak areas needing reinforcement
- Strong areas
- Skipped concepts
- Growth trends`,

  "report-month": `Execute NOW: Call mcp__vibe-learning__get_report_data with period="month", then format as monthly report.`,

  "report-save": `Execute NOW: Call mcp__vibe-learning__save_report with period="week". Confirm file saved.`,

  unknowns: `Execute NOW: Call mcp__vibe-learning__get_unknown_unknowns with period="month" and limit=10, then show:
- Unknown concepts by priority
- Why each is important
- Related concepts`,

  "unknowns-save": `Execute NOW: Call mcp__vibe-learning__save_unknowns with period="month" and limit=20. Confirm file saved.`,

  review: `Execute NOW: Call mcp__vibe-learning__get_due_reviews with limit=5. For each due concept, ask a level-appropriate question and record results.`,

  interview: `Execute NOW: Call mcp__vibe-learning__get_stats with period="month". Then conduct interview-style Level 3-5 questions on the learned concepts.`,

  pause: `Execute NOW: Call mcp__vibe-learning__set_mode with paused_until set to 1 hour from now (ISO format). Confirm paused.`,

  off: `Execute NOW: Call mcp__vibe-learning__set_mode with senior_enabled=false and after_enabled=false. Confirm learning is off (recording continues).`,

  on: `Execute NOW: Call mcp__vibe-learning__set_mode with senior_enabled=true and after_enabled=true. Confirm full learning mode enabled.`,

  "senior-on": `Execute NOW: Call mcp__vibe-learning__set_mode with senior_enabled=true. Confirm senior mode enabled.

Senior mode behavior: Ask conceptual questions BEFORE implementation.`,

  "senior-off": `Execute NOW: Call mcp__vibe-learning__set_mode with senior_enabled=false. Confirm senior mode disabled.`,

  "after-on": `Execute NOW: Call mcp__vibe-learning__set_mode with after_enabled=true. Confirm after mode enabled.

After mode behavior: Ask learning questions AFTER task completion.`,

  "after-off": `Execute NOW: Call mcp__vibe-learning__set_mode with after_enabled=false. Confirm after mode disabled.`,
};

// Senior mode behavior prompt - injected when user sends a task
const SENIOR_BEHAVIOR_PROMPT = `Ask ONE question per round. Minimum 2 rounds required.

Format (MUST show header on Round 1):
**[VibeLearning Senior Mode]**
[Round 1/3] [One short question]?
_(skip: say "skip" to proceed)_

Flow:
- Round 1: MUST show header + "[Round 1/3] Why this approach?"
- Round 2: ALWAYS ask "[Round 2/3] What alternatives did you consider? Tradeoffs?"
  (Skip only if user named 2+ alternatives with specific tradeoffs)
- Round 3: If Round 2 vague, "[Round 3/3] Hint: [hint]. What do you think?"
- FINAL STEP (MANDATORY): Call record_learning, THEN say "Good thinking! Implementing now."

After final round, call BOTH tools:

1. mcp__vibe-learning__record_learning({
    concept_id: "kebab-case-concept",
    level: 3,
    result: "correct" | "partial" | "skipped"
  })

2. mcp__vibe-learning__record_unknown_unknown({
    concept_id: "related-concept",
    related_to: "main-concept",
    context: "brief context",
    why_important: "why important"
  })

THEN say "Good thinking! Implementing now."

ONE question per round. Be strict like a real senior.`;

const AUTO_LEARNING_PROMPT = `[VibeLearning - Task Completion]

Task completed. Execute these steps NOW (in order):

**STEP 1: Identify Concepts (ALWAYS DO THIS)**
Identify 1-3 key concepts used in this task. Use kebab-case (e.g., "redis-caching", "jwt-auth", "react-hooks").

**STEP 2: Record Unknown Unknowns (ALWAYS DO THIS)**
For each concept, think of 1-2 related concepts the user might not know.
Call mcp__vibe-learning__record_unknown_unknown for each:
- concept_id: the unknown concept (e.g., "cache-stampede")
- related_to: the concept from the task (e.g., "redis-caching")
- context: brief context of how it relates
- why_important: why they should learn it

Example: Task used JWT auth → record "refresh-token-rotation", "token-revocation"

**STEP 3: Register Main Concept (ALWAYS DO THIS)**
Call mcp__vibe-learning__get_concept_level for the main concept to register it in the learning system.

**STEP 4: Ask Learning Question (CONDITIONAL)**
Call mcp__vibe-learning__should_ask_question to check.
- If shouldAsk is true:
  - Format:
    **[VibeLearning]**
    _Learning Question (Level X)_
    [Your question here]?
  - After user answers, call mcp__vibe-learning__record_learning
- If shouldAsk is false: skip silently (no cooldown message needed)`;

function parseLearnCommand(text: string): string | null {
  const lower = text.toLowerCase().trim();

  if (lower === "/learn" || lower === "/learn status") return "status";
  if (lower === "/learn stats") return "stats";
  if (lower === "/learn report --save" || lower === "/learn report -s") return "report-save";
  if (lower === "/learn report month") return "report-month";
  if (lower === "/learn report") return "report";
  if (lower === "/learn unknowns --save" || lower === "/learn unknowns -s") return "unknowns-save";
  if (lower === "/learn unknowns") return "unknowns";
  if (lower === "/learn review") return "review";
  if (lower === "/learn interview") return "interview";
  if (lower === "/learn pause") return "pause";
  if (lower === "/learn off") return "off";
  if (lower === "/learn on") return "on";
  if (lower === "/learn senior on") return "senior-on";
  if (lower === "/learn senior off") return "senior-off";
  if (lower === "/learn senior") return "senior-on"; // Default to on
  if (lower === "/learn after on") return "after-on";
  if (lower === "/learn after off") return "after-off";
  if (lower === "/learn after") return "after-on"; // Default to on
  if (lower.startsWith("/learn focus ")) return "focus";

  return null;
}

const VibeLearningPlugin: Plugin = async (ctx) => {
  const { client } = ctx;

  client.app.log({
    level: "info",
    message: "[VibeLearning] Plugin loaded (v2 - independent toggles)",
  }).catch(() => {});

  const injectPrompt = (sessionID: string, prompt: string) => {
    client.session.prompt({
      path: { id: sessionID },
      body: { parts: [{ type: "text", text: prompt }] },
      query: { directory: ctx.directory },
    }).catch((err) => {
      client.app.log({ level: "error", message: `[VibeLearning] Inject failed: ${err}` }).catch(() => {});
    });
  };

  return {
    "tool.execute.before": async (
      input: { tool: string; sessionID: string; callID: string; args: Record<string, unknown> }
    ): Promise<void> => {
      // Show toast on first vibe-learning MCP call per session
      if (input.tool.startsWith("mcp__vibe-learning__")) {
        if (shownToastForSession !== input.sessionID) {
          shownToastForSession = input.sessionID;
          const modeInfo = seniorEnabled && afterEnabled ? "Full mode"
            : seniorEnabled ? "Senior mode"
            : afterEnabled ? "After mode"
            : "Off";
          client.tui.showToast({
            body: {
              title: "🎓 VibeLearning",
              message: `Active (${modeInfo}). /learn for status.`,
              variant: "info" as const,
              duration: 3000
            },
          }).catch(() => {});
        }
      }
    },

    "tool.execute.after": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { title: string; output: string; metadata: any }
    ): Promise<void> => {
      lastSessionID = input.sessionID;
      const toolLower = input.tool.toLowerCase();
      if (!CONFIG.SIGNIFICANT_TOOLS.includes(toolLower)) return;

      toolCount++;
      const filePath = output.metadata?.file_path || output.title || "";
      const concept = extractConceptFromPath(filePath);
      if (concept) addConcept(concept);

      // Trigger after learning if after mode is enabled
      if (afterEnabled && toolCount >= CONFIG.TOOL_THRESHOLD) {
        const now = Date.now();
        if (now - lastLearningPrompt >= CONFIG.COOLDOWN_MS) {
          toolCount = 0;
          lastLearningPrompt = now;
          const sessionID = lastSessionID;

          setTimeout(() => {
            if (sessionID) {
              client.tui.showToast({
                body: { title: "🎓 VibeLearning", message: "Learning time!", variant: "info" as const, duration: 3000 },
              }).catch(() => {});
              injectPrompt(sessionID, AUTO_LEARNING_PROMPT);
            }
          }, 2000);
        }
      }
    },

    "chat.message": async (
      input: { sessionID: string; agent?: string; model?: unknown; messageID?: string; variant?: string },
      output: { message: { role: string; content?: string }; parts: unknown[] }
    ): Promise<void> => {
      const { message } = output;
      if (!message) return;
      const { role, content } = message;
      if (role !== "user" || !content) return;

      lastSessionID = input.sessionID;

      const cmd = parseLearnCommand(content);
      if (cmd) {
        // Update local mode state based on command
        if (cmd === "off") {
          seniorEnabled = false;
          afterEnabled = false;
        } else if (cmd === "on") {
          seniorEnabled = true;
          afterEnabled = true;
        } else if (cmd === "senior-on") {
          seniorEnabled = true;
        } else if (cmd === "senior-off") {
          seniorEnabled = false;
        } else if (cmd === "after-on") {
          afterEnabled = true;
        } else if (cmd === "after-off") {
          afterEnabled = false;
        } else if (cmd === "pause") {
          lastLearningPrompt = Date.now();
        }

        // Execute command
        const prompt = COMMAND_PROMPTS[cmd];
        if (prompt) {
          client.tui.showToast({
            body: { title: "🎓 VibeLearning", message: `Executing /learn ${cmd}...`, variant: "info" as const, duration: 2000 },
          }).catch(() => {});

          setTimeout(() => {
            if (lastSessionID) {
              injectPrompt(lastSessionID, prompt);
            }
          }, 500);
        }

        client.app.log({ level: "info", message: `[VibeLearning] Command: ${cmd}` }).catch(() => {});
      } else {
        // Not a /learn command - check if we need to inject senior mode behavior
        if (seniorEnabled) {
          // In senior mode, inject behavior prompt for task requests
          const trimmed = content.trim();
          // Only inject if message looks like a task (longer than a few words and not a response)
          if (trimmed.length > 10 && !trimmed.match(/^(yes|no|ok|skip|done|correct|partial|incorrect|got it|이해|알겠|넵|응|아니|스킵)/i)) {
            setTimeout(() => {
              if (lastSessionID) {
                injectPrompt(lastSessionID, SENIOR_BEHAVIOR_PROMPT);
              }
            }, 100);

            client.app.log({ level: "info", message: `[VibeLearning] Injected senior mode behavior` }).catch(() => {});
          }
        }
      }
    },
  };
};

export { VibeLearningPlugin };
export default VibeLearningPlugin;
