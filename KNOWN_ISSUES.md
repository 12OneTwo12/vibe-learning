# Known Issues

## Session Start Context Display

**Feature**: Show unknown unknowns and due reviews when a session starts (before user's first message)

**Status**: Not implemented due to platform limitations

### Claude Code

- `SessionStart` hook only supports **silent context injection** via `additionalContext`
- The injected context is visible to Claude but **not displayed to the user**
- There is no mechanism to force Claude to display this context in its first response
- Related issues: [#10373](https://github.com/anthropics/claude-code/issues/10373), [#13650](https://github.com/anthropics/claude-code/issues/13650)

### OpenCode

- `session.created` event is **not received** by npm-installed plugins
- Only local plugin files (in `~/.config/opencode/plugin/`) receive this event
- This appears to be an OpenCode bug where npm package plugins are loaded differently

### Workaround

Use `/learn` or `/learn status` command to manually check:
- Unknown unknowns: `/learn unknowns`
- Due reviews: `/learn review`
