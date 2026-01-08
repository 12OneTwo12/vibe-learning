---
description: VibeLearning - spaced repetition learning while coding
argument-hint: [status|on|off|senior|after|pause|stats|report|unknowns|review]
---

# VibeLearning Command

Use the **vibe-learning MCP server** tools to execute this command. The server is registered as `plugin:vibe-learning:vibe-learning`.

Parse `$ARGUMENTS` and execute:

## No args or `status` - Show Status

Call these tools from vibe-learning MCP:
- `get_mode` - Get current mode settings
- `should_ask_question` - Check if learning question is allowed

Then display:
- Senior mode: on/off
- After mode: on/off
- Cooldown status
- Consecutive skips

## `on` - Full Learning Mode

Call: `set_mode` with `senior_enabled=true, after_enabled=true`

## `off` - Turn Off

Call: `set_mode` with `senior_enabled=false, after_enabled=false`

## `senior` or `senior on` - Enable Senior Mode

Call: `set_mode` with `senior_enabled=true`

## `senior off` - Disable Senior Mode

Call: `set_mode` with `senior_enabled=false`

## `after` or `after on` - Enable After Mode

Call: `set_mode` with `after_enabled=true`

## `after off` - Disable After Mode

Call: `set_mode` with `after_enabled=false`

## `pause` - Pause 1 Hour

Call: `set_mode` with `paused_until="<1 hour from now in ISO format>"`

## `focus [area]` - Focus Area

Call: `set_mode` with `focus_area="<area>"`

## `stats` - Statistics

Call: `get_stats` with `period="month"`

Format results as dashboard.

## `report` - Weekly Report

Call: `get_report_data` with `period="week"`

## `report month` - Monthly Report

Call: `get_report_data` with `period="month"`

## `report --save` - Save Report

Call: `save_report` with `period="week"`

## `unknowns` - Unknown Unknowns

Call: `get_unknown_unknowns` with `period="month", limit=10`

## `unknowns --save` - Save Unknowns

Call: `save_unknowns` with `period="month", limit=20`

## `review` - Start Review

Call: `get_due_reviews` with `limit=5`

Then ask questions for each due concept.

## `interview` - Interview Mode

Call: `get_stats` with `period="month"`

Then conduct interview-style deep questions on learned concepts.
