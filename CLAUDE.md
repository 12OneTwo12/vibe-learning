# VibeLearning Integration

## Session Start Context

At the start of each session, VibeLearning injects context about:
- **Unknown Unknowns**: Concepts the user encountered but hasn't explored
- **Due Reviews**: Concepts scheduled for spaced repetition review

**IMPORTANT**: If this context is present in your conversation, mention it briefly in your first response:
```
**[VibeLearning]** You have 3 unexplored concepts and 1 concept due for review. Use `/learn unknowns` or `/learn review` to explore them.
```
Keep it concise (1-2 lines) and don't overwhelm the user.

## Automatic Learning Questions

After completing a task, follow this procedure:

### 1. Check if Question is Allowed
After completing a task, call `should_ask_question` to check if a question can be asked.

### 2. Question Conditions
Only proceed with a learning question if `shouldAsk: true`:
- 15-minute cooldown between questions
- Auto-pause for 1 hour after 2 consecutive skips

### 3. Concept Selection and Questioning
Select a core concept used in the task:
1. Check current level with `get_concept_level`
   - **New concepts start at Level 3** (mid-level)
   - This respects experienced developers and finds the right level quickly
2. Generate a question appropriate for the level (use polite language):
   - Level 1: "Do you know what ~ is?" (Recognition)
   - Level 2: "Can you explain why ~ is needed?" (Understanding)
   - Level 3: "What are the differences between ~ and ~?" (Comparison)
   - Level 4: "What are the edge cases and solutions for ~?" (Edge Cases)
   - Level 5: "How would you design ~ in a large-scale system?" (Architecture)

### 4. Record Result
After user response, call `record_learning`:
- `correct`: Understood correctly -> 2 consecutive correct = level up
- `partial`: Partial understanding -> level stays the same
- `incorrect`: Wrong answer -> **immediate level down** (finds true level)
- `skipped`: User skipped -> level stays the same

**Level Down Framing:** When level decreases, frame it positively:
- "Let's strengthen the basics! Found your level: Level 2"
- NOT "You got it wrong, level decreased"

### 5. Unknown Unknowns
When you discover related concepts the user might not know:
- Record with `record_unknown_unknown`
- Example: While implementing JWT -> record "refresh-token-rotation"

## Mode Behavior

Check current mode with `get_mode`. Returns independent toggles:

- **seniorEnabled** (default: true): Pre-implementation conceptual questions
- **afterEnabled** (default: true): Post-implementation spaced repetition questions

Combinations:
- Both on: Full learning (default)
- senior only: Questions before implementation
- after only: Questions after task completion
- Both off: No questions (recording continues for reports)

### Senior Mode (seniorEnabled: true)

BEFORE writing any code, test conceptual understanding like a senior developer:

**Format:**
```
**[VibeLearning Senior Mode]**
[Round 1/3] [Senior-level question]?
_(skip: say "skip" to proceed)_
```

**Question Style** - Test understanding, not gather requirements:
- WRONG: "What data will you cache?" (requirements gathering)
- RIGHT: "Why do you need caching here?" (reasoning)
- RIGHT: "What is cache-aside pattern?" (concept)
- RIGHT: "What problems can caching introduce?" (tradeoffs)

**Flow:**
1. Round 1: Test conceptual understanding or ask WHY
2. Round 2: Ask about tradeoffs, edge cases, or compare alternatives
3. After rounds: Call `record_learning` + `record_unknown_unknown`, then implement

### After Mode (afterEnabled: true)

AFTER task completion:

1. Identify 1-3 key concepts used
2. Record unknown unknowns for related concepts
3. Check `should_ask_question`
4. If shouldAsk: ask learning question with format:
   ```
   **[VibeLearning]**
   _Learning Question (Level X)_
   [Your question here]?
   ```

## Example Flow

```
[Task Completed]
|
should_ask_question -> shouldAsk: true
|
get_concept_level("cache-aside") -> level: 3 (new concept, starts at 3)
|
"What's the difference between Cache-Aside and Write-Through patterns?"
|
[User Response: Incorrect]
|
record_learning("cache-aside", 3, "incorrect")
|
"Let's strengthen the basics! Found your level: Level 2. Next review: 1 day"

[Next Session]
|
get_concept_level("cache-aside") -> level: 2
|
"Can you explain how Cache-Aside pattern works?"
|
[User Response: Correct]
|
record_learning("cache-aside", 2, "correct")
|
"Correct! Next review: 3 days"
```

## Commands

- `/learn` or `/learn status` - Show current mode status
- `/learn on` - Enable full learning (senior + after)
- `/learn off` - Disable all learning
- `/learn senior` - Enable senior mode
- `/learn senior off` - Disable senior mode
- `/learn after` - Enable after mode
- `/learn after off` - Disable after mode
- `/learn pause` - Pause for 1 hour
- `/learn stats` - Show statistics
- `/learn report` - Weekly report
- `/learn unknowns` - Unknown unknowns list
- `/learn review` - Review due concepts
