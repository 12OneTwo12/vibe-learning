# VibeLearning

**Learn while vibe coding** - Spaced repetition learning system for AI coding agents

Turn your coding sessions into learning opportunities. VibeLearning automatically asks you questions about the concepts you're using, helping you truly understand the code you write with AI assistance.

## Features

- **Automatic Learning Triggers**: Just install and it works across all sessions
- **SM-2 Algorithm**: Scientific spaced repetition (like Anki)
- **5-Level System**: Recognition → Understanding → Comparison → Edge Cases → Architecture
- **Fatigue Management**: 15-min cooldown, auto-pause after consecutive skips
- **Unknown Unknowns**: Tracks concepts you don't know you don't know
- **Report Export**: Save learning reports as markdown files

## Supported Platforms

| Platform | Auto Install | Features |
|----------|--------------|----------|
| **OpenCode** | ✅ | Plugin + MCP + /learn commands |
| **Claude Code** | ✅ | Hooks + MCP + /learn commands |
| Cursor | 📋 Manual | MCP server only |
| Cline | 📋 Manual | MCP server only |

## Installation

### OpenCode

```bash
# Install VibeLearning for OpenCode
npx vibe-learning install opencode

# Restart OpenCode to apply changes
```

**What gets installed:**
- MCP server in `~/.config/opencode/opencode.json`
- Plugin: `vibe-learning-opencode` (auto-installed via npm)
- Command: `~/.config/opencode/command/learn.md` (for autocomplete)
  - Plugin handles all `/learn` commands via chat.message hook

### Claude Code

1. Open Claude Code and run `/plugins`
2. Go to **Marketplaces** tab
3. Click **+ Add Marketplace**
4. Enter: `12OneTwo12/vibe-learning`
5. Go to **Discover** tab
6. Select **vibe-learning** and Enter **Install**
7. Restart Claude Code

**What gets installed:**
- MCP server (via `.mcp.json`)
- Hooks: SessionStart, PostToolUse, Stop
- Command: `/vibe-learning:learn`

**Auto-approve MCP permissions (recommended):**

Claude Code asks for MCP tool permissions every new session. To skip this, add to `~/.claude/settings.json`:

```json
{
  "permissions": {
    "allow": ["mcp__vibe-learning"]
  }
}
```

### Check Status

```bash
npx vibe-learning status
```

### Manual Installation (Cursor, Cline, etc.)

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "vibe-learning": {
      "command": "npx",
      "args": ["-y", "vibe-learning", "serve"]
    }
  }
}
```

## How It Works

1. **Request a task** from your AI coding agent
2. **AI asks 2-3 questions** about your approach (Senior mode, default)
3. **Explain your reasoning** - why this approach? what alternatives?
4. **AI implements** after you demonstrate understanding
5. **Progress is tracked** using spaced repetition for optimal retention

## Usage

### /learn Commands

Both OpenCode and Claude Code support the `/learn` command:

#### Status & Control

| Command | Description |
|---------|-------------|
| `/learn` | Show current status |
| `/learn on` | Full learning mode (senior + after, default) |
| `/learn off` | Turn off learning (recording continues) |
| `/learn senior` | Enable senior mode (pre-implementation questions) |
| `/learn senior off` | Disable senior mode |
| `/learn after` | Enable after mode (post-implementation questions) |
| `/learn after off` | Disable after mode |
| `/learn pause` | Pause for 1 hour |
| `/learn focus [area]` | Focus questions on a specific area |

#### Statistics & Reports

| Command | Description |
|---------|-------------|
| `/learn stats` | Learning statistics dashboard |
| `/learn report` | Weekly learning report |
| `/learn report month` | Monthly learning report |
| `/learn report --save` | Save report as markdown file |
| `/learn unknowns` | Unknown unknowns dashboard |
| `/learn unknowns --save` | Save unknowns as markdown file |
| `/learn review` | Start reviewing due concepts |
| `/learn interview` | Interview practice mode |

### Learning Levels

| Level | Name | Question Style |
|-------|------|---------------|
| 1 | Recognition | "Do you know what X is?" |
| 2 | Understanding | "Can you explain how X works?" |
| 3 | Comparison | "When would you use X instead of Y?" |
| 4 | Edge Cases | "What are the pitfalls of X?" |
| 5 | Architecture | "How would you design X at scale?" |

### Answering Questions

When asked a learning question, respond naturally. The AI will evaluate your answer as:
- **correct** - You understood it well → Level up possible
- **partial** - Partial understanding → Stay at current level
- **incorrect** - Wrong answer → May level down
- **skipped** - Too busy right now → Asked again later

### Learning Modes

VibeLearning uses two independent toggles that can be combined:

| Toggle | Default | Behavior |
|--------|---------|----------|
| **Senior Mode** | ✅ On | Pre-implementation questioning (2-3 rounds) |
| **After Mode** | ✅ On | Post-task learning questions |

**Mode Combinations:**

| Senior | After | Result |
|--------|-------|--------|
| ✅ | ✅ | Full learning (default) - Questions before AND after |
| ✅ | ❌ | Senior only - Deep pre-implementation review |
| ❌ | ✅ | After only - Quick post-task questions |
| ❌ | ❌ | Off - No questions (recording continues) |

#### Senior Mode Details

Senior mode simulates a strict senior developer reviewing your decisions:

```
**[VibeLearning Senior Mode]**
[Round 1/3] Why this approach?

[Round 2/3] What alternatives did you consider? Tradeoffs?

[Round 3/3] (if needed) Hint: ... What do you think?

Good thinking! [Summary]. Implementing now.
```

- **Minimum 2 rounds required** - Won't skip to implementation on first answer
- **Strict evaluation** - Only proceeds when you demonstrate understanding of alternatives and tradeoffs
- **Educational summary** - Provides brief explanation before implementing
- **Learning recorded** - Discussions are recorded for spaced repetition review

## MCP Tools Reference

For direct MCP integration or custom implementations:

| Tool | Description |
|------|-------------|
| `should_ask_question` | Check if it's a good time to ask |
| `get_concept_level` | Get current level (1-5) for a concept |
| `record_learning` | Record learning result |
| `record_unknown_unknown` | Register a concept the user might not know |
| `get_stats` | Get learning statistics |
| `get_report_data` | Get comprehensive report data |
| `get_unknown_unknowns` | Get list of unexplored concepts |
| `mark_explored` | Mark a concept as explored |
| `get_due_reviews` | Get concepts due for review |
| `get_mode` / `set_mode` | Manage learning mode |
| `save_report` | Save report to markdown file |
| `save_unknowns` | Save unknowns to markdown file |
| `get_interview_data` | Get interview prep data with mastery levels |

## Data Storage

- **Database**: `~/.vibe-learning/learning.db` (SQLite)
- **Reports**: `~/.vibe-learning/*.md`

## Uninstallation

### Automatic Uninstall

```bash
npx vibe-learning uninstall
```

This removes:
- OpenCode plugin and command files
- Claude Code command and hook files

### Manual Uninstall

#### OpenCode

1. Remove plugin from `~/.config/opencode/opencode.json`:
   ```json
   {
     "plugin": ["vibe-learning-opencode"]  // Remove this line
   }
   ```

2. Remove MCP server from `~/.config/opencode/opencode.json`:
   ```json
   {
     "mcp": {
       "vibe-learning": { ... }  // Remove this block
     }
   }
   ```

3. Delete command file:
   ```bash
   rm ~/.config/opencode/command/learn.md
   ```

#### Claude Code

Run in Claude Code:
```
/plugins uninstall vibe-learning
```

Or manually:
1. Run `/plugins`
2. Find **vibe-learning** in installed plugins
3. Click **Uninstall**

### Complete Data Removal

To also remove all learning data:

```bash
rm -rf ~/.vibe-learning/
```

## Development

```bash
# Clone the repository
git clone https://github.com/jeongjeong-il/vibe-learning.git
cd vibe-learning

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## FAQ

### Do I really need a plugin for this?

Honestly, no. Most of VibeLearning's features can be implemented with just prompts or CLAUDE.md instructions. You could set up spaced repetition questions, senior mode discussions, and learning tracking through well-crafted system prompts alone.

However, we built this as a plugin for those who:
- Don't want to manually configure system prompts for every project
- Prefer a one-click install over copy-pasting CLAUDE.md instructions
- Want the few extra features that only MCP/plugins can provide:
  - **Persistent SQLite database** for tracking progress across sessions
  - **SM-2 algorithm calculations** with automatic review scheduling
  - **Cross-project statistics** and reports

If you enjoy configuring things yourself, feel free to grab ideas from our [CLAUDE.md](./CLAUDE.md) and adapt them to your workflow.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    VibeLearning                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   OpenCode  │  │ Claude Code │  │   Cursor    │     │
│  │   Plugin    │  │   (Hooks)   │  │   (MCP)     │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │             │
│         ▼                ▼                ▼             │
│  ┌─────────────────────────────────────────────────┐   │
│  │              MCP Server (Core)                   │   │
│  │  - SM-2 Algorithm                                │   │
│  │  - SQLite Database                               │   │
│  │  - 14 Tools                                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## License

MIT
