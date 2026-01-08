#!/usr/bin/env node
/**
 * VibeLearning Unified CLI
 *
 * Single entry point for all VibeLearning commands:
 * - install [platform]  : Install VibeLearning
 * - uninstall [platform]: Uninstall VibeLearning
 * - status              : Show installation status
 * - serve               : Run MCP server (used by AI agents)
 */

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  switch (command) {
    case 'install':
    case 'uninstall':
    case 'status': {
      // Delegate to installer
      const { runInstaller } = await import('./installer.js');
      await runInstaller(command, args);
      break;
    }

    case 'serve': {
      // Run MCP server
      const { startServer } = await import('./index.js');
      await startServer();
      break;
    }

    case 'hook:session': {
      // Legacy: kept for backwards compatibility with older plugin versions
      // Does nothing but prevents "Unknown command" error
      console.log(JSON.stringify({ status: 'ok' }));
      break;
    }

    case 'hook:activity': {
      // PostToolUse hook - silently track activity
      // The actual learning logic is handled by the MCP server
      // This hook just ensures the session is active
      console.log(JSON.stringify({ tracked: true }));
      break;
    }

    case 'hook:stop': {
      // Stop hook - prompt for learning question if conditions met
      const { FatigueService } = await import('./services/fatigue.service.js');
      const { ModeService } = await import('./services/mode.service.js');
      const { SessionStateRepository, ModeStateRepository } = await import('./db/repositories/index.js');

      const sessionRepo = new SessionStateRepository();
      const modeRepo = new ModeStateRepository();
      const fatigueService = new FatigueService(sessionRepo);
      const modeService = new ModeService(modeRepo);

      const mode = modeService.getMode();

      // Check if after mode is enabled
      if (!mode.afterEnabled) {
        console.log(JSON.stringify({ shouldAsk: false, reason: 'After mode is off' }));
        break;
      }

      // Check if paused
      if (mode.pausedUntil && new Date(mode.pausedUntil) > new Date()) {
        console.log(JSON.stringify({ shouldAsk: false, reason: 'Learning is paused' }));
        break;
      }

      const result = fatigueService.shouldAskQuestion();

      if (result.shouldAsk) {
        // Output instruction to stderr for Claude to see
        const instruction = `[VibeLearning - Task Completion]

Execute these steps NOW:

1. Record 1-2 unknown unknowns (related concepts user might not know):
   mcp__vibe-learning__record_unknown_unknown({
     concept_id: "related-concept",
     related_to: "the task you just completed",
     context: "brief context",
     why_important: "why important"
   })

2. Call mcp__vibe-learning__should_ask_question to check if learning question needed.

3. If shouldAsk is true:
   - Call mcp__vibe-learning__get_concept_level with concept_id='the task you just completed'
   - Ask with format:
     **[VibeLearning]**
     _Learning Question (Level X)_
     [Your question]?
   - After answer, call mcp__vibe-learning__record_learning

4. If shouldAsk is false: you may stop.`;

        console.error(instruction);
      }

      console.log(JSON.stringify(result));
      break;
    }

    case undefined:
    case 'help':
    case '--help':
    case '-h': {
      console.log(`
VibeLearning - Learn while vibe coding

Usage: vibe-learning <command> [options]

Commands:
  install [platform]    Install VibeLearning
                        Platforms: opencode, claude-code (default: auto-detect)

  uninstall [platform]  Uninstall VibeLearning

  status                Show installation status

  serve                 Run MCP server (internal use by AI agents)

Examples:
  npx vibe-learning install              # Auto-detect and install
  npx vibe-learning install opencode     # Install for OpenCode only
  npx vibe-learning install claude-code  # Install for Claude Code only
  npx vibe-learning status               # Check installation
  npx vibe-learning uninstall            # Uninstall from all platforms

Documentation: https://github.com/jeongjeong-il/vibe-learning
`);
      break;
    }

    default: {
      console.error(`Unknown command: ${command}`);
      console.error('Run "vibe-learning help" for usage information.');
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
