#!/usr/bin/env python3
"""VibeLearning Session Start Hook - Shows unknown unknowns and due reviews"""

import json, sys, os, sqlite3

DB_PATH = os.path.expanduser("~/.vibe-learning/learning.db")

def get_unknown_unknowns(limit=5):
    if not os.path.exists(DB_PATH):
        return []
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT concept_id, related_to, why_important, appearances
            FROM unknown_unknowns
            WHERE explored = 0
            ORDER BY appearances DESC, first_seen DESC
            LIMIT ?
        """, (limit,))
        results = cursor.fetchall()
        conn.close()
        return [{"concept": r[0], "related": r[1], "why": r[2], "count": r[3]} for r in results]
    except:
        return []

def get_due_reviews(limit=5):
    if not os.path.exists(DB_PATH):
        return []
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT concept_id, current_level
            FROM concept_progress
            WHERE next_review <= datetime('now')
            ORDER BY next_review ASC
            LIMIT ?
        """, (limit,))
        results = cursor.fetchall()
        conn.close()
        return [{"concept": r[0], "level": r[1]} for r in results]
    except:
        return []

def generate_context():
    lines = ["# [vibe-learning] Session Context", ""]

    unknowns = get_unknown_unknowns(5)
    if unknowns:
        lines.append("## Unknown Unknowns (concepts to explore)")
        for u in unknowns:
            lines.append(f"- **{u['concept']}** (from {u['related']}): {u['why']}")
        lines.append("")

    due = get_due_reviews(5)
    if due:
        lines.append("## Due for Review")
        for d in due:
            lines.append(f"- {d['concept']} (Level {d['level']})")
        lines.append("")

    if not unknowns and not due:
        lines.append("No pending items. Ready to learn!")
        lines.append("")

    return "\n".join(lines)

def main():
    # Check if running in TTY (interactive) mode
    if sys.stdin.isatty():
        # Interactive mode - just print the context
        print(generate_context())
    else:
        # Hook mode - read stdin first, then output JSON
        stdin_data = sys.stdin.read()
        context = generate_context()

        # Print to stderr for user-visible output
        print(context, file=sys.stderr)

        # Print JSON to stdout for context injection
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "SessionStart",
                "additionalContext": context
            }
        }))

if __name__ == "__main__":
    main()
