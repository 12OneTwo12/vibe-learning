#!/usr/bin/env python3
"""VibeLearning Learning Trigger for Claude Code"""

import json, sys, os, time

TRACKER_FILE = os.path.expanduser("~/.vibe-learning/claude_tracker.json")
TOOL_THRESHOLD = 3
COOLDOWN_MS = 15 * 60 * 1000

def load_tracker():
    if os.path.exists(TRACKER_FILE):
        try:
            with open(TRACKER_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {"tool_count": 0, "last_learning_prompt": 0, "senior_enabled": True, "after_enabled": True, "concepts": []}

def save_tracker(tracker):
    os.makedirs(os.path.dirname(TRACKER_FILE), exist_ok=True)
    with open(TRACKER_FILE, 'w') as f:
        json.dump(tracker, f)

def main():
    try:
        data = json.load(sys.stdin)
    except:
        data = {}

    tracker = load_tracker()
    tool_count = tracker.get("tool_count", 0)
    last_prompt = tracker.get("last_learning_prompt", 0)
    after_enabled = tracker.get("after_enabled", True)

    # Only trigger if after mode is enabled
    if not after_enabled or tool_count < TOOL_THRESHOLD:
        sys.exit(0)

    now = int(time.time() * 1000)
    if now - last_prompt < COOLDOWN_MS:
        sys.exit(0)

    concepts = tracker.get("concepts", [])
    concept_hint = concepts[-1] if concepts else "the task you just completed"

    tracker["tool_count"] = 0
    tracker["last_learning_prompt"] = now
    save_tracker(tracker)

    # Block Claude from stopping and instruct it to complete learning tasks
    reason = f"""[VibeLearning - Task Completion]

Execute these steps NOW:

1. Record 1-2 unknown unknowns (related concepts user might not know):
   mcp__vibe-learning__record_unknown_unknown({{
     concept_id: "related-concept",
     related_to: "{concept_hint}",
     context: "brief context",
     why_important: "why important"
   }})

2. Call mcp__vibe-learning__should_ask_question to check if learning question needed.

3. If shouldAsk is true:
   - Call mcp__vibe-learning__get_concept_level with concept_id='{concept_hint}'
   - Ask with format:
     **[VibeLearning]**
     _Learning Question (Level X)_
     [Your question]?
   - After answer, call mcp__vibe-learning__record_learning

4. If shouldAsk is false: you may stop."""

    print(json.dumps({
        "decision": "block",
        "reason": reason
    }))
    sys.exit(0)

if __name__ == "__main__":
    main()
