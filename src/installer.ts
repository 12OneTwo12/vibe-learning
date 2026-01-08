#!/usr/bin/env node
/**
 * VibeLearning Installer
 *
 * Automatically installs VibeLearning for various AI coding agents.
 * Usage: npx vibe-learning install [platform]
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, rmSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// ============================================================
// OpenCode Command File (minimal - for autocomplete discovery only)
// ============================================================

const OPENCODE_LEARN_COMMAND = `---
description: VibeLearning - spaced repetition learning while coding
argument-hint: [status|on|off|senior|after|pause|stats|report|unknowns|review]
---

# EXECUTE NOW

Parse \`$ARGUMENTS\` and execute the matching command:

## (empty) or \`status\` - Show Status
\`\`\`
mcp__vibe-learning__get_mode
mcp__vibe-learning__should_ask_question
\`\`\`
Display: senior mode on/off, after mode on/off, cooldown, consecutive skips

## \`on\` - Full Learning Mode (default)
\`\`\`
mcp__vibe-learning__set_mode(senior_enabled=true, after_enabled=true)
\`\`\`

## \`off\` - Turn Off
\`\`\`
mcp__vibe-learning__set_mode(senior_enabled=false, after_enabled=false)
\`\`\`

## \`senior\` or \`senior on\` - Enable Senior Mode
\`\`\`
mcp__vibe-learning__set_mode(senior_enabled=true)
\`\`\`

## \`senior off\` - Disable Senior Mode
\`\`\`
mcp__vibe-learning__set_mode(senior_enabled=false)
\`\`\`

## \`after\` or \`after on\` - Enable After Mode
\`\`\`
mcp__vibe-learning__set_mode(after_enabled=true)
\`\`\`

## \`after off\` - Disable After Mode
\`\`\`
mcp__vibe-learning__set_mode(after_enabled=false)
\`\`\`

## \`pause\` - Pause 1 Hour
\`\`\`
mcp__vibe-learning__set_mode(paused_until="<1 hour from now ISO>")
\`\`\`

## \`stats\` - Statistics
\`\`\`
mcp__vibe-learning__get_stats(period="month")
\`\`\`

## \`report\` - Weekly Report
\`\`\`
mcp__vibe-learning__get_report_data(period="week")
\`\`\`

## \`report month\` - Monthly Report
\`\`\`
mcp__vibe-learning__get_report_data(period="month")
\`\`\`

## \`unknowns\` - Unknown Unknowns
\`\`\`
mcp__vibe-learning__get_unknown_unknowns(period="month", limit=10)
\`\`\`

## \`review\` - Due Reviews
\`\`\`
mcp__vibe-learning__get_due_reviews(limit=5)
\`\`\`
`;

// ============================================================
// Platform Installers
// ============================================================

interface Platform {
  name: string;
  detect: () => boolean;
  install: () => void;
}

function getOpencodeConfigPath(): string {
  return join(homedir(), ".config", "opencode");
}

function getClaudeConfigPath(): string {
  return join(homedir(), ".claude.json");
}

function getMcpServerCommand(): string[] {
  return ["npx", "-y", "vibe-learning", "serve"];
}

const platforms: Platform[] = [
  {
    name: "opencode",
    detect: () => {
      const opencodeDir = join(homedir(), ".opencode");
      const configDir = getOpencodeConfigPath();
      return existsSync(opencodeDir) || existsSync(configDir);
    },
    install: () => {
      const configDir = getOpencodeConfigPath();
      const commandDir = join(configDir, "command");
      const configFile = join(configDir, "opencode.json");

      // Create directories
      mkdirSync(commandDir, { recursive: true });

      // Write minimal command file (for autocomplete discovery only)
      writeFileSync(join(commandDir, "learn.md"), OPENCODE_LEARN_COMMAND);
      console.log("  ✓ Command registered: /learn (autocomplete enabled)");

      // Update opencode.json
      let config: Record<string, unknown> = {
        "$schema": "https://opencode.ai/config.json",
        plugin: [],
      };

      if (existsSync(configFile)) {
        try {
          config = JSON.parse(readFileSync(configFile, "utf-8"));
        } catch {
          // Use default
        }
      }

      // Add plugin to plugin array
      if (!config.plugin) config.plugin = [];
      const plugins = config.plugin as string[];
      if (!plugins.includes("vibe-learning-opencode")) {
        plugins.push("vibe-learning-opencode");
      }

      // Add MCP server
      if (!config.mcp) config.mcp = {};
      (config.mcp as Record<string, unknown>)["vibe-learning"] = {
        type: "local",
        command: getMcpServerCommand(),
        enabled: true,
      };

      writeFileSync(configFile, JSON.stringify(config, null, 2));
      console.log("  ✓ Plugin registered: vibe-learning-opencode (npm)");
      console.log("  ✓ MCP server registered in opencode.json");
      console.log("");
      console.log("  📌 OpenCode will auto-install the plugin on first launch!");
    },
  },
  {
    name: "claude-code",
    detect: () => existsSync(getClaudeConfigPath()),
    install: () => {
      // Claude Code: Just tell users to use /plugins add
      // The plugin includes: MCP server (.mcp.json), commands, hooks
      console.log("");
      console.log("  📌 For Claude Code, use the plugin system:");
      console.log("");
      console.log("     /plugins add 12OneTwo12/vibe-learning");
      console.log("");
      console.log("  This installs everything:");
      console.log("    • MCP server (via .mcp.json)");
      console.log("    • /learn command");
      console.log("    • Hooks (SessionStart, PostToolUse, Stop)");
      console.log("");
      console.log("  💡 Then restart Claude Code to activate.");
    },
  },
];

// ============================================================
// CLI Commands
// ============================================================

function printUsage(): void {
  console.log(`
VibeLearning Installer

Usage:
  npx vibe-learning install [platform]

Platforms:
  opencode     - OpenCode AI coding agent (plugin + MCP)
  claude-code  - Claude Code CLI (use /plugins add)
  all          - Install for all detected platforms

Examples:
  npx vibe-learning install           # Auto-detect and install
  npx vibe-learning install opencode  # Install for OpenCode only
  npx vibe-learning install all       # Install for all platforms

Commands:
  /learn              Show status
  /learn on           Full learning (senior + after, default)
  /learn off          Turn off (recording continues)
  /learn senior       Enable senior mode (pre-implementation)
  /learn senior off   Disable senior mode
  /learn after        Enable after mode (post-implementation)
  /learn after off    Disable after mode
  /learn pause        Pause 1 hour
  /learn stats        Statistics dashboard
  /learn report       Weekly report
  /learn unknowns     Unknown unknowns
  /learn review       Review due concepts
`);
}

function install(targetPlatform?: string): void {
  console.log("\n🎓 VibeLearning Installer\n");

  const toInstall =
    targetPlatform === "all"
      ? platforms
      : targetPlatform
        ? platforms.filter((p) => p.name === targetPlatform)
        : platforms.filter((p) => p.detect());

  if (toInstall.length === 0) {
    if (targetPlatform) {
      console.log(`❌ Platform "${targetPlatform}" not found or not supported.`);
    } else {
      console.log("❌ No supported AI coding agents detected.");
      console.log("   Supported: opencode, claude-code");
    }
    process.exit(1);
  }

  for (const platform of toInstall) {
    console.log(`\n📦 Installing for ${platform.name}...`);
    try {
      platform.install();
      console.log(`✅ ${platform.name} installation complete!`);
    } catch (err) {
      console.error(`❌ Failed to install for ${platform.name}:`, err);
    }
  }

  console.log("\n🎉 Installation complete!");
  console.log("\nNext steps:");
  console.log("  1. Restart your AI coding agent (Claude Code / OpenCode)");
  console.log("  2. Start coding - learning questions will appear after 3+ tool uses!");
  console.log("  3. Use /learn commands to check status and stats\n");
}

function getOpencodeCache(): string {
  return join(homedir(), ".cache", "opencode");
}

function uninstall(): void {
  console.log("\n🗑️  VibeLearning Uninstaller\n");

  // OpenCode - config files
  const opencodePlugin = join(getOpencodeConfigPath(), "plugin", "vibe-learning.ts");
  const opencodeCommand = join(getOpencodeConfigPath(), "command", "learn.md");
  if (existsSync(opencodePlugin)) {
    unlinkSync(opencodePlugin);
    console.log("  ✓ Removed OpenCode plugin file");
  }
  if (existsSync(opencodeCommand)) {
    unlinkSync(opencodeCommand);
    console.log("  ✓ Removed OpenCode command");
  }

  // OpenCode - clear plugin from opencode.json
  const opencodeConfig = join(getOpencodeConfigPath(), "opencode.json");
  if (existsSync(opencodeConfig)) {
    try {
      const config = JSON.parse(readFileSync(opencodeConfig, "utf-8"));
      let changed = false;

      // Remove from plugin array
      if (config.plugin && Array.isArray(config.plugin)) {
        const idx = config.plugin.indexOf("vibe-learning-opencode");
        if (idx !== -1) {
          config.plugin.splice(idx, 1);
          changed = true;
        }
      }

      // Remove MCP server
      if (config.mcp && config.mcp["vibe-learning"]) {
        delete config.mcp["vibe-learning"];
        changed = true;
      }

      if (changed) {
        writeFileSync(opencodeConfig, JSON.stringify(config, null, 2));
        console.log("  ✓ Removed from opencode.json");
      }
    } catch {
      // Ignore
    }
  }

  // OpenCode - clear cache (IMPORTANT!)
  const cacheDir = getOpencodeCache();
  const cachedPlugin = join(cacheDir, "node_modules", "vibe-learning-opencode");
  const cacheLock = join(cacheDir, "bun.lock");
  const cachePackage = join(cacheDir, "package.json");

  if (existsSync(cachedPlugin)) {
    rmSync(cachedPlugin, { recursive: true, force: true });
    console.log("  ✓ Removed cached plugin");
  }

  if (existsSync(cacheLock)) {
    unlinkSync(cacheLock);
    console.log("  ✓ Removed bun.lock");
  }

  // Update cache package.json to remove fixed version
  if (existsSync(cachePackage)) {
    try {
      const pkg = JSON.parse(readFileSync(cachePackage, "utf-8"));
      if (pkg.dependencies && pkg.dependencies["vibe-learning-opencode"]) {
        delete pkg.dependencies["vibe-learning-opencode"];
        writeFileSync(cachePackage, JSON.stringify(pkg, null, 2));
        console.log("  ✓ Removed from cache package.json");
      }
    } catch {
      // Ignore
    }
  }

  // Legacy: Claude Code command (old installations)
  const claudeCommand = join(homedir(), ".claude", "commands", "learn.md");
  if (existsSync(claudeCommand)) {
    unlinkSync(claudeCommand);
    console.log("  ✓ Removed legacy Claude Code command");
  }

  // Remove MCP server from ~/.claude.json (legacy)
  const claudeConfigFile = getClaudeConfigPath();
  if (existsSync(claudeConfigFile)) {
    try {
      const config = JSON.parse(readFileSync(claudeConfigFile, "utf-8"));
      if (config.mcpServers && config.mcpServers["vibe-learning"]) {
        delete config.mcpServers["vibe-learning"];
        writeFileSync(claudeConfigFile, JSON.stringify(config, null, 2));
        console.log("  ✓ Removed legacy MCP server from ~/.claude.json");
      }
    } catch {
      // Ignore errors
    }
  }

  console.log("\n✅ Uninstall complete!");
  console.log("   Note: If you installed via /plugins add, use /plugins to remove it.\n");
}

function status(): void {
  console.log("\n📊 VibeLearning Status\n");

  for (const platform of platforms) {
    const detected = platform.detect();
    console.log(`  ${detected ? "✅" : "❌"} ${platform.name}: ${detected ? "detected" : "not found"}`);
  }

  // Check installed files - OpenCode
  const opencodePlugin = join(getOpencodeConfigPath(), "plugin", "vibe-learning.ts");
  const opencodeCommand = join(getOpencodeConfigPath(), "command", "learn.md");

  console.log("\n  OpenCode:");
  console.log(`    ${existsSync(opencodePlugin) ? "✅" : "❌"} Plugin`);
  console.log(`    ${existsSync(opencodeCommand) ? "✅" : "❌"} /learn command`);

  console.log("\n  Claude Code:");
  console.log("    Use /plugins to check installed plugins");

  console.log("");
}

// ============================================================
// Exported Runner (called from main.ts)
// ============================================================

export async function runInstaller(command: string, args: string[]): Promise<void> {
  switch (command) {
    case "install":
      install(args[0]);
      break;
    case "uninstall":
      uninstall();
      break;
    case "status":
      status();
      break;
    case "help":
    case "--help":
    case "-h":
      printUsage();
      break;
    default:
      if (command) {
        console.log(`Unknown command: ${command}`);
      }
      printUsage();
      process.exit(1);
  }
}

// ============================================================
// Direct Execution (legacy, for backwards compatibility)
// ============================================================

const isDirectExecution = process.argv[1]?.includes('installer');
if (isDirectExecution) {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  runInstaller(command, args.slice(1)).catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
