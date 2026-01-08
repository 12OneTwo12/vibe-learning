#!/bin/bash
#
# VibeLearning Shell Hook
#
# Platform-independent hook that works with ANY AI coding agent.
# Add to your shell config (.zshrc, .bashrc) to trigger learning after commands.
#
# Usage:
#   source /path/to/vibe-learning/hooks/shell-hook.sh
#
# Or add to .zshrc/.bashrc:
#   export VIBE_LEARNING_PATH="/path/to/vibe-learning"
#   source "$VIBE_LEARNING_PATH/hooks/shell-hook.sh"
#

VIBE_LEARNING_PATH="${VIBE_LEARNING_PATH:-$(dirname "$(dirname "$(realpath "$0")")")}"
VIBE_CLI="$VIBE_LEARNING_PATH/dist/cli.js"

# Commands that trigger learning check (customize as needed)
VIBE_TRIGGER_COMMANDS=(
  "npm test"
  "npm run test"
  "npm run build"
  "yarn test"
  "yarn build"
  "pnpm test"
  "pnpm build"
  "pytest"
  "go test"
  "cargo test"
  "make test"
  "make build"
  "git commit"
  "git push"
)

# Track last command
__vibe_last_command=""

# Called before command execution
__vibe_preexec() {
  __vibe_last_command="$1"
}

# Called after command execution
__vibe_precmd() {
  local exit_code=$?

  # Only proceed if last command succeeded
  [ $exit_code -ne 0 ] && return

  # Check if it was a trigger command
  local should_check=false
  for trigger in "${VIBE_TRIGGER_COMMANDS[@]}"; do
    if [[ "$__vibe_last_command" == *"$trigger"* ]]; then
      should_check=true
      break
    fi
  done

  [ "$should_check" = false ] && return

  # Check with VibeLearning CLI
  if [ -f "$VIBE_CLI" ]; then
    local result
    result=$(node "$VIBE_CLI" should-ask 2>/dev/null)

    if [ $? -eq 0 ]; then
      local should_ask
      should_ask=$(echo "$result" | grep -o '"shouldAsk":\s*true')

      if [ -n "$should_ask" ]; then
        # Get a concept to review
        local concept_result
        concept_result=$(node "$VIBE_CLI" get-random-concept 2>/dev/null)

        if [ $? -eq 0 ]; then
          local concept_id
          concept_id=$(echo "$concept_result" | grep -o '"conceptId":"[^"]*"' | cut -d'"' -f4)
          local level
          level=$(echo "$concept_result" | grep -o '"level":[0-9]*' | cut -d':' -f2)

          if [ -n "$concept_id" ] && [ "$concept_id" != "null" ]; then
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "🎓 VibeLearning: Quick check on '$concept_id' (Level $level)"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "📝 Please ask me a level-$level question about '$concept_id'."
            echo "   After I answer, record my result with record_learning()."
            echo ""
          fi
        fi
      fi
    fi
  fi
}

# Install hooks based on shell
if [ -n "$ZSH_VERSION" ]; then
  # Zsh
  autoload -Uz add-zsh-hook
  add-zsh-hook preexec __vibe_preexec
  add-zsh-hook precmd __vibe_precmd
elif [ -n "$BASH_VERSION" ]; then
  # Bash (requires bash-preexec or similar)
  if [ -n "$__bp_precmd_funcs" ]; then
    precmd_functions+=(__vibe_precmd)
    preexec_functions+=(__vibe_preexec)
  else
    # Fallback: use PROMPT_COMMAND
    __vibe_prompt_command() {
      __vibe_precmd
    }
    PROMPT_COMMAND="__vibe_prompt_command;$PROMPT_COMMAND"
  fi
fi

echo "✅ VibeLearning shell hook loaded"
