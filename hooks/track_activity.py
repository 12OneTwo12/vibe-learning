#!/usr/bin/env python3
"""VibeLearning Activity Tracker for Claude Code"""

import json, sys, os, time

TRACKER_FILE = os.path.expanduser("~/.vibe-learning/claude_tracker.json")
SIGNIFICANT_TOOLS = ["Edit", "Write", "Bash"]

def ensure_dir():
    os.makedirs(os.path.dirname(TRACKER_FILE), exist_ok=True)

def load_tracker():
    ensure_dir()
    if os.path.exists(TRACKER_FILE):
        try:
            with open(TRACKER_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {"tool_count": 0, "last_learning_prompt": 0, "senior_enabled": True, "after_enabled": True, "concepts": []}

def save_tracker(tracker):
    ensure_dir()
    with open(TRACKER_FILE, 'w') as f:
        json.dump(tracker, f)

def extract_concept(tool_name, tool_input):
    file_path = tool_input.get("file_path", "") or tool_input.get("path", "")
    command = tool_input.get("command", "")

    patterns = [
        (["test", "spec"], "unit-testing"),
        (["auth", "login", "jwt"], "authentication"),
        (["api", "endpoint", "route"], "api-design"),
        (["cache", "redis"], "caching"),
        ([".tsx", ".jsx"], "react-components"),
        (["db", "database", "prisma"], "database"),
    ]

    for keywords, concept in patterns:
        for kw in keywords:
            if kw.lower() in file_path.lower():
                return concept

    if "git" in command: return "git-workflow"
    if "docker" in command: return "containerization"
    return None

def main():
    try:
        data = json.load(sys.stdin)
    except:
        sys.exit(0)

    tool_name = data.get("tool_name", "")
    if tool_name not in SIGNIFICANT_TOOLS:
        sys.exit(0)

    tracker = load_tracker()
    tracker["tool_count"] = tracker.get("tool_count", 0) + 1

    concept = extract_concept(tool_name, data.get("tool_input", {}))
    if concept:
        concepts = tracker.get("concepts", [])
        if concept not in concepts:
            concepts.append(concept)
            if len(concepts) > 10:
                concepts.pop(0)
            tracker["concepts"] = concepts

    save_tracker(tracker)
    sys.exit(0)

if __name__ == "__main__":
    main()
