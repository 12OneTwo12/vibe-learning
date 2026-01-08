# VibeLearning MCP - Project Planning Document

> **"Vibe code while actually learning"**
> A learning MCP server for AI coding agents like Claude Code and OpenCode

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution](#2-solution)
3. [Target Users](#3-target-users)
4. [Core Features](#4-core-features)
   - 4.1 Immediate Value: Code Insights
   - 4.2 Progressive Depth System
   - 4.3 Spaced Repetition System (SM-2)
   - 4.4 Learning Analytics
   - 4.5 Interview Prep
   - 4.6 Question Strategy (Fatigue Management)
   - 4.7 Answer Evaluation Philosophy
   - 4.8 Learning Reports
   - 4.9 Unknown Unknowns Visualization
   - 4.10 Senior Mode ← NEW
5. [User Scenarios](#5-user-scenarios)
6. [Architecture](#6-architecture)
7. [Tech Stack](#7-tech-stack)
8. [Competitive Analysis](#8-competitive-analysis)
9. [Roadmap](#9-roadmap)
10. [Open Questions](#10-open-questions)

---

## 1. Problem Statement

### The Core Problem

AI coding tools have increased productivity, but developer skill growth remains unverified.

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│   "AI makes me 10x productive..."                           │
│                                                              │
│   "...but am I actually growing as a developer?"            │
│                                                              │
│   "What if I can't explain my code in an interview?"        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Specific Symptoms

| Situation | Problem |
|-----------|---------|
| Code works | Can't explain why it works |
| 5th time implementing same concept | Still Level 1 understanding |
| Interview prep | No confidence without AI |
| Debugging | Worried about skill degradation from AI dependency |

### Limitations of Existing Tools

| Tool | Does | Doesn't |
|------|------|---------|
| AI Coding (Copilot, Claude) | Generate code fast | Verify understanding |
| Ask LLM | Explain when asked | Proactively check, track progress |
| Learning Platforms (LeetCode) | Teach concepts | Connect to real work |
| Code Review Tools | Check code quality | Check developer understanding |

**The Gap:** Nothing actively ensures you're learning while you code.

---

## 2. Solution

### VibeLearning: Your Learning Buffer

VibeLearning is an MCP server that **automatically triggers and tracks learning** during vibe coding.

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│   AI Coding ←──── VibeLearning ────→ Real Learning          │
│   (Fast)          (Buffer)            (Growth)              │
│                                                              │
│   Keep the speed.  Bridge the gap.    Gain the skills.      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Core Value Propositions

1. **Proactive Learning** - Asks without being asked
2. **Depth Tracking** - Different questions at different levels for same concept
3. **Optimized Review** - Spaced repetition based on forgetting curve
4. **Growth Measurement** - Data-driven mastery verification

### Why an MCP Server?

**Core Problem:** Claude has no memory across sessions.

```
┌─────────────────────────────────────────────────────────────┐
│                   Claude's Fundamental Limitation            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Session 1: "Learned Cache-Aside pattern"                   │
│  Session 2: "What did I learn last time?" → Claude: "I don't know" │
│                                                              │
│  Session 5: "Am I good at caching?" → Claude: "You seem good"│
│             (guessing without actual data)                   │
│                                                              │
│  Session 10: "Anything to review?" → Claude: "Not sure..."  │
│              (no records to check)                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

Prompts and CLAUDE.md can't solve this:

| Feature | Claude Alone | VibeLearning MCP |
|---------|--------------|------------------|
| Ask questions | ✅ Possible | ✅ |
| **Query learning from 3 weeks ago** | ❌ No memory | ✅ SQLite |
| **"Time to review" reminders** | ❌ Impossible | ✅ SM-2 scheduling |
| **"Caching 78%" mastery data** | ❌ Only guesses | ✅ Actual data |
| **"You skip every time JWT comes up" pattern analysis** | ❌ No data | ✅ Record analysis |
| **"+23% growth" long-term trends** | ❌ Hallucination risk | ✅ SQL queries |

**What MCP Provides:**

```
1. Persistent Memory (SQLite)
   └─ "Learned Cache-Aside 2 weeks ago, reached Level 2"

2. Review Reminders (SM-2)
   └─ "JWT review is due. Want to go over it today?"

3. Mastery Data
   └─ "Caching 78%, Auth 52%, DB 89%"

4. Pattern Analysis
   └─ "You always skip when Kubernetes comes up"

5. Growth Evidence
   └─ "Average level 1.8 → 2.6 over 3 months"
```

**Key insight:** VibeLearning isn't just a "question prompt" - it's an MCP tool that **remembers learning across sessions, reminds you to review, and proves your growth**.

### Value Delivery Timeline

| When | Value Felt |
|------|------------|
| **Immediately** | Code Insight - "Oh, that's what this is" |
| **First session** | Problem detection - "Didn't know that" |
| **First week** | Weekly report - "Here's what I worked on this week" |
| **First month** | Growth dashboard + weakness analysis - "I'm weak in auth" |
| **3 months** | Depth level increase + interview prep - "Reaching senior level" |

**Off mode users also get value:**

```
First week: /learn report → "It summarizes even without questions"
           → Low barrier to entry while still delivering value
```

### Modes and Features Separation

**Mode** = When to ask questions (question timing)
**Features** = Available anytime (invoked by command)

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  Modes (Question Timing)          Features (Always Available)│
│  ─────────────────────            ─────────────────────────  │
│  • After  - After task complete   • /learn report  - Report │
│  • Before - Before implementation • /learn stats   - Stats  │
│  • Off    - No questions          • /learn review  - Review │
│                                   • /learn interview- Prep  │
│                                                              │
│  ⚠️ Key: Recording continues in ALL modes                   │
│     → Even Off mode accumulates data                        │
│     → Reports available anytime                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Four Modes

| Mode | When | Behavior | Key Feature |
|------|------|----------|-------------|
| **After** (Default) | Regular work | Questions after task summary | Natural wrap-up |
| **Before** | Learning new tech | Understanding check before implementation | Skippable, never blocks |
| **Off** | Urgent deadline | Recording only, no questions | No interruption, reports still available |
| **Senior** | When you want to deepen skills | Must justify decisions before code generation | Critical thinking development |

### Trigger Method: Task Summary Based

AI Agents generate summaries when tasks complete. We extract key concepts from these summaries:

```
┌─────────────────────────────────────────────────────────────┐
│              Task Summary Based Trigger                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Developer: "Implement Redis caching"                    │
│                                                              │
│  2. LLM: [Performs task]                                    │
│     - Modifies src/services/user.ts                         │
│     - Creates src/cache/redis.ts                            │
│     - Adds tests/cache.test.ts                              │
│                                                              │
│  3. LLM: "Done!                                             │
│                                                              │
│     📋 Task Summary:                                        │
│     • Added Redis caching to UserService                    │
│     • Applied Cache-Aside pattern                           │
│     • Set TTL to 1 hour                                     │
│                                                              │
│     💡 By the way, do you know what                         │
│        Cache-Aside pattern is?"                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Why after task summary:**

| Per code generation | After task summary |
|--------------------|--------------------|
| Interrupts flow | Natural wrap-up |
| Needs code analysis | Concepts already in summary |
| Frequent triggers | Appropriate frequency |

---

## 3. Target Users

### Core Target: Developers Who Want Real Growth Despite the Friction

```
"AI makes me fast, but... am I actually growing?"
"What if they ask 'why did you do it this way?' in an interview"
"I know I'm anxious. That's why I want to do something about it."
```

- Comfortable with vibe coding but genuinely anxious about skill degradation
- Tried tools like Anki but gave up because they were disconnected from coding
- No time for separate study, but willing to answer 1-2 questions after tasks

### Specific Personas

| Persona | Core Motivation |
|---------|-----------------|
| **Growth-Minded Junior** (1-3 yrs) | "I want to become senior, but AI-only might keep me junior forever" |
| **Interview-Prepping Developer** | Needs to practice answering "why did you do it this way?" |
| **Self-Improving Senior** (5+ yrs) | Anxious about AI dependency, wants to maintain sharp instincts |

### Not Target Users

- Developers satisfied with vibe coding → Questions feel annoying
- **Developers anxious but unwilling to act** → Will use Off mode only and uninstall (we don't dilute features for them)

---

## 4. Core Features

### 4.1 Immediate Value: Code Insights

Provide value before asking questions:

```
Developer: "Implement Redis caching for user API"

Claude: [generates caching code]

"Done! Implemented Redis caching using Cache-Aside pattern.

💡 Things to know about this code:
• Cache-Aside pattern used (most common approach)
• 1-hour TTL = typical choice, adjustable based on data characteristics
• Note: Cache Stampede possible with high traffic

Ask if you have questions!"
```

**Why it matters:**
- Immediate value without questions
- First moment user feels "this tool is useful"
- Information gained without learning burden

### 4.2 Progressive Depth System

Different questions based on mastery level for same concept:

```
┌─────────────────────────────────────────────────────────────┐
│              Progressive Depth Levels                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Level 1 - Recognition                                       │
│  "What caching pattern did I use here?"                     │
│  → "Cache-Aside"                                            │
│                                                              │
│  Level 2 - Understanding                                     │
│  "Can you explain how Cache-Aside works?"                   │
│  → Check cache → miss → fetch DB → store in cache           │
│                                                              │
│  Level 3 - Comparison/Tradeoffs                              │
│  "When would you use Write-Through instead?"                │
│  → Consistency vs latency, write-heavy workloads            │
│                                                              │
│  Level 4 - Edge Cases                                        │
│  "What's Cache Stampede and how do you prevent it?"         │
│  → Thundering herd, mutex locks, early refresh              │
│                                                              │
│  Level 5 - Architecture                                      │
│  "Design caching for 10M user social feed"                  │
│  → Multi-layer, CDN, hot/cold separation, invalidation      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**How it works:**

```
Session 1: First encounter with caching
Claude: "When would you use Write-Through instead?" (Level 3 - default start)
User: "I'm not sure..."
→ Recorded: Caching Level 2 (immediate level down to find true level)

Session 2: Caching concept again
Claude: "Can you explain how Cache-Aside works?" (Level 2)
User: "Check cache first, if miss, fetch from DB and store"
→ Recorded: Caching Level 2 ✓ (stays at 2, needs 2 correct to level up)

Session 3: Caching concept again (correct again)
Claude: "Can you explain the tradeoffs?" (Level 2)
User: "Fast reads but data can be stale..."
→ Recorded: Caching Level 3 ✓ (2 consecutive correct = level up!)
```

**Why start at Level 3:**
- Respects experienced developers (no "do you know what X is?" basics)
- Quickly finds true level through adaptive calibration
- More engaging questions from the start
```

### 4.3 Spaced Repetition System (SM-2)

Reminds you to review before you forget:

```
┌─────────────────────────────────────────────────────────────┐
│              Ebbinghaus Forgetting Curve                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Memory                                                      │
│  Retention                                                   │
│     │                                                        │
│ 100%├─●                                                      │
│     │  ╲        Review 1      Review 2      Review 3        │
│  80%│   ╲          ●             ●             ●            │
│     │    ╲        ╱ ╲           ╱ ╲           ╱ ╲           │
│  60%│     ╲      ╱   ╲         ╱   ╲         ╱   ╲          │
│     │      ╲    ╱     ╲       ╱     ╲       ╱     ╲         │
│  40%│       ╲  ╱       ╲     ╱       ╲     ╱       ╲        │
│     │        ●──────────●───────────●───────────●           │
│  20%│     Without review: rapid forgetting                   │
│     │                                                        │
│     └─────┬─────┬─────┬─────┬─────┬─────┬───── Time        │
│         Day1  Day3  Day7  Day14 Day30 Day60                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**How it works:**

```
Correct → Increase interval (1d → 3d → 7d → 14d → 30d...)
Incorrect → Reset interval, retry with easier form

Day 1:  Learn JWT auth → Next review: Day 2
Day 2:  Review (correct) → Next review: Day 5
Day 5:  Review (correct) → Next review: Day 12
Day 12: Review (struggled) → Next review: Day 14 (shortened)
```

### 4.4 Learning Analytics

```
When /stats is run:

┌─────────────────────────────────────────────────────────────┐
│                    Learning Status                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Last 30 Days Summary                                        │
│  ───────────────────────────────────────────────────────    │
│  Concepts covered: 42                                        │
│  Average depth: Level 2.6                                    │
│  Accuracy: 73%                                               │
│                                                              │
│  Mastery by Area                                             │
│  ───────────────────────────────────────────────────────    │
│  Caching        ████████████░░░░  78%  L3                   │
│  Auth           ████████░░░░░░░░  52%  L2  ← Needs focus    │
│  Database       ██████████████░░  89%  L4                   │
│  API Design     ██████████░░░░░░  67%  L3                   │
│                                                              │
│  💡 Auth area has been stagnant for 3 weeks.                │
│     Recommend focused learning next time JWT comes up.      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.5 Interview Prep

```
When /interview is run:

Claude: "Practice based on your code history?

Technical Areas:
• Auth (JWT, refresh token) - 7 implementations, 85% mastery
• Caching (Redis) - 5 implementations, 78% mastery
• Kubernetes - 4 implementations, 58% mastery ← Weak area

Which area do you want to practice?"

Developer: "Kubernetes"

Claude: "Good choice. Based on your deployment from 2 weeks ago:

'You set resource limits to 256Mi memory and 500m CPU.
Walk me through how you decided on these numbers.
What happens if too low? Too high?'"

Developer: [answers]

Claude: "Good points! To make your answer stronger:
• Mention difference between requests and limits
• Distinguish OOMKilled vs CPU throttling
• Mention monitoring and adjusting based on actual usage

What interviewers look for: not just 'what' but 'why' and tradeoffs"
```

### 4.6 Question Strategy (Fatigue Management)

#### Core Risk: Breaking Coding Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    The Biggest Concern                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  "Won't questions during vibe coding break my flow?"        │
│                                                              │
│  This is a real risk.                                       │
│                                                              │
│  No matter how good the learning tool is,                   │
│  If it's annoying → disable → no learning                   │
│                                                              │
│  VibeLearning failure scenario:                             │
│  Deep in coding → question pops up → "ugh annoying" → uninstall │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Design Philosophy:** When in doubt, don't ask

```
Missed learning opportunity < User churn

Once disabled, it never gets re-enabled.
Better to ask fewer questions.
```

**Current Countermeasures:**

| Countermeasure | Effect |
|----------------|--------|
| 15-minute cooldown | Prevent consecutive questions |
| 2 consecutive skips → 1-hour auto-pause | Auto-detect busy |
| "Skip" instantly ends | Easy escape |
| Question after task summary (not during code gen) | Natural timing |

**Is this enough?**

Honestly: **We don't know. Need to try it.**

```
Phase 0 Success Criteria:
- Use it 5 times yourself
- Find it useful at least 3 times
- ✨ Not annoying ← This is key
```

**Things being considered:**

```
1. Flow Detection
   - Auto-skip if rapidly generating code in sequence
   - Detect "seems like you're in the zone"

2. Question Timing Adjustment
   - Current: After task summary
   - Alternative: At session end (minimize flow disruption)
   - Tradeoff: Learning context becomes weaker

3. Intensity Selection on First Install
   - "Active" / "Normal" / "Quiet" modes
   - User chooses directly
```

**Core Principle:** Nothing is worse than churn

---

**Risk:** Too many questions → User disables → No learning

#### Default Setting (Gentle)

```
┌─────────────────────────────────────────────────────────────┐
│              Default Question Strategy                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Questions per session: Unlimited (skip-based pause)         │
│  Cooldown: 15 minutes                                        │
│  Target: New concepts or concepts due for review only        │
│                                                              │
│  Example session (1 hour coding):                            │
│  ├── 0:00  Code gen #1 (simple CRUD) → No question          │
│  ├── 0:10  Code gen #2 (JWT impl) → Question #1             │
│  ├── 0:25  Code gen #3 (caching) → Cooldown, skip           │
│  ├── 0:40  Code gen #4 (Rate Limiting) → Question #2        │
│  └── 0:55  Code gen #5 (refactoring) → Question #3          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Question Selection Priority

```
Priority 1: Never-seen concepts (new learning opportunity)
Priority 2: Level 1-2 concepts (foundation building)
Priority 3: Review due (SM-2 schedule)
Priority 4: Previously incorrect concepts (reinforcement needed)

Excluded:
- Level 4-5 concepts (already mastered)
- Concepts already asked this session
- Minor changes (typo fixes, formatting)
```

#### Fatigue Detection → Auto Response

```
┌─────────────────────────────────────────────────────────────┐
│              Adaptive Question Frequency                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Signal                        → Response                   │
│  ─────────────────────────────────────────────────────────  │
│  2+ consecutive skips          → 1-hour auto-pause          │
│  "I'm busy" keyword            → 24-hour pause              │
│  Week participation < 30%      → Auto reduce frequency      │
│                                                              │
│  Core principle: When in doubt, don't ask                   │
│  → User churn is worse than missed learning opportunity     │
│                                                              │
│  What MCP tracks:                                           │
│  • consecutive_skips (consecutive skip count)               │
│  • paused_until (pause expiration timestamp)                │
│  • last_question_at (last question timestamp)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### User Control

```
/learn pause      → Pause for 1 hour
/learn off        → Disable until re-enabled
/learn light      → Minimum questions
/learn focus auth → Only auth questions
```

#### "Escape Hatch" Design

Easy opt-out for every question:

```
Claude: "Quick question about the caching pattern..."

Developer: "skip" (or just ignore)

Claude: "No problem! Let me know if you want to discuss later."
        → No penalty, no guilt, recorded as skipped
```

### 4.7 Answer Evaluation Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│                   Evaluation Principles                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Benefit of the Doubt                                     │
│     • If understanding shown, mark correct                  │
│     • No penalty for imperfect terminology                  │
│     • "Almost right" is partial, not incorrect              │
│                                                              │
│  2. Focus on Learning, Not Testing                           │
│     • Wrong answer → Teaching opportunity                   │
│     • Never make user feel stupid                           │
│     • Genuinely celebrate correct answers                   │
│                                                              │
│  3. Transparent Scoring                                       │
│     • Can explain "why partial?" if asked                   │
│     • Show expected key points                              │
│     • Offer further discussion                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Evaluation Examples:**

```
Question: "What caching pattern did I use here?"
Key Points: ["Cache-Aside", "Lazy Loading", "check cache first"]

Answer: "Cache-Aside - check cache, if miss fetch from DB"
→ Result: correct (pattern name + described flow)

Answer: "It caches stuff"
→ Result: partial (knows it's caching but didn't identify pattern)

Answer: "Write-Through pattern"
→ Result: incorrect (wrong pattern) → Provide explanation
```

### 4.8 Learning Reports

Since learning records accumulate in all modes, reports can be generated anytime.

#### Report Commands

```
/learn report           → This week's report (default)
/learn report week      → This week
/learn report month     → This month
/learn report auth      → Auth area only
/learn report --save    → Save as md file
```

#### Report Example

```markdown
# 📊 Learning Report (Jan Week 1, 2026)

## This Week Summary
- Concepts covered: 12 (5 new, 7 repeated)
- Question response rate: 75% (8/12 answered)
- Average level: 2.3 → 2.6 (+0.3)

---

## 🔴 Areas Needing Reinforcement

### 1. Auth - 4 appearances

**Why reinforcement needed:**
- JWT refresh token implemented 3 times, similar questions each time
- Relied on Claude's explanation for "token expiry handling"

**Recommended learning:**
- [ ] Clarify JWT vs Session differences
- [ ] Understand Refresh Token Rotation
- [ ] Token theft response strategies

**Expected interview question:**
> "How would you respond if a JWT token gets stolen?"

---

### 2. Caching - 3 appearances

**Observed patterns:**
- Knows Cache-Aside ✅
- Relied on Claude's explanation for Cache Stampede ⚠️

**Recommended learning:**
- [ ] 3 patterns for preventing Cache Stampede
- [ ] TTL setting criteria (by data characteristics)

---

## ✅ Strong Areas

### Database
- High understanding of index design (Level 3)
- Can identify and solve N+1 problems

### API Design
- Consistent REST conventions
- Established error handling patterns

---

## 💡 This Week's Unknown Unknowns

> Concepts encountered but not explored this week

1. **Connection Pooling** - Appeared in DB connection code
2. **Rate Limiting Algorithms** - Token Bucket vs Leaky Bucket
3. **CORS Preflight** - Why OPTIONS request goes first

---

## 📈 Compared to Last Week

| Area | Last Week | This Week | Change |
|------|-----------|-----------|--------|
| Auth | 2x | 4x | 🔺 More frequent |
| Caching | 1x | 3x | 🔺 |
| K8s | 3x | 0x | - Not touched |

---

*Next report: January 13, 2026 (Mon)*
```

#### Value Even in Off Mode

```
┌─────────────────────────────────────────────────────────────┐
│                    Off Mode User Scenario                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Mon-Thu: Sprint mode, Off mode                             │
│           → No questions, no interruption                   │
│           → But recording continues                         │
│                                                              │
│  Friday: "/learn report"                                    │
│          → "You worked on auth a lot this week.            │
│             How about reviewing JWT sometime?"              │
│                                                              │
│  Value: Zero disruption to coding flow                      │
│         while still getting weekly learning status          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### What Reports Provide

| Item | Description |
|------|-------------|
| **Areas needing reinforcement** | Concepts that appear often but levels aren't rising |
| **Unknown Unknowns** | Concepts passed by without exploration |
| **Expected interview questions** | Questions generated based on weak areas |
| **Growth trends** | Changes compared to last week/month |
| **Learning patterns** | Which areas you work with frequently |

### 4.9 Unknown Unknowns Visualization

**Core Value:** Helps you discover "what you don't know you don't know."

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│   Known Unknowns              Unknown Unknowns              │
│   (Know you don't know)       (Don't know you don't know)   │
│   ┌─────────────────┐         ┌─────────────────────────┐   │
│   │                 │         │                          │   │
│   │  "What's JWT?"  │         │  If you don't know       │   │
│   │  → You can ask  │         │  "Cache Stampede" you    │   │
│   │                 │         │  can't even ask about it │   │
│   │                 │         │                          │   │
│   └─────────────────┘         └─────────────────────────┘   │
│                                        ↑                     │
│                                  VibeLearning                │
│                                  catches this                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### How It Works

```
1. Detect concepts in code
   → "Implemented with Cache-Aside pattern"
   → Record concept: cache-aside

2. Auto-connect related concepts
   → cache-aside → [cache-stampede, write-through, ttl-strategy]
   → Track unexplored ones

3. Display in Unknown Unknowns dashboard
   → "Cache Stampede: related code appeared 3 times, explored 0 times"
```

#### Dashboard Example

```
/learn unknowns:

┌─────────────────────────────────────────────────────────────┐
│              🔍 Unknown Unknowns Dashboard                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Concepts you passed by this month                          │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🔴 High Priority (frequent, never explored)                │
│  ├─ Cache Stampede     - caching code 5x, explored 0x       │
│  │   └─ "Can kill your DB under high traffic"              │
│  ├─ Connection Pooling - DB code 4x, explored 0x            │
│  │   └─ "May need connection management optimization"      │
│  └─ Token Rotation     - auth code 3x, explored 0x          │
│      └─ "Important for security hardening"                  │
│                                                              │
│  🟡 Worth looking into                                       │
│  ├─ Rate Limiting algorithms (Token Bucket vs Leaky Bucket) │
│  └─ CORS Preflight mechanics                                │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  💡 "Learn about Cache Stampede" [Enter]                    │
│  💡 "Save full list as report" → /learn unknowns --save     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Exploration Flow

```
User: "Learn about Cache Stampede"

Claude: "Cache Stampede is when the cache expires and
thousands of requests simultaneously hit the DB.

This can happen in the Redis caching you just implemented:
- TTL expires + concurrent requests → DB overload

Solutions:
• Mutex Lock: Only one request regenerates cache
• Early Refresh: Refresh before expiration
• Jitter: Add random values to TTL

Fine for now, but consider this when traffic grows.

Say 'got it' if understood, 'tell me more' if you want to go deeper."
```

**When exploration completes:**
```
→ cache-stampede: explored = true
→ Removed from Unknown Unknowns
→ Added to learning records
```

#### Why This Matters

```
Without VibeLearning:
  Code works → Move on → Don't know Cache Stampede → Learn after outage

With VibeLearning:
  Code works → "Related concept exists" → Learn beforehand

Difference:
  Learn before vs after the incident
```

### 4.10 Senior Mode

**Core Value:** "Tough senior developer" mode that pushes you up to 3 rounds

```
┌─────────────────────────────────────────────────────────────┐
│                    Before vs Senior Key Difference          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Before Mode                      Senior Mode              │
│   ─────────────────────────       ─────────────────────     │
│                                                              │
│   "Do you know what X is?"         "Why did you choose X?" │
│   → 1 round then proceed           → Up to 3 rounds push   │
│   → Wrong? Explain & proceed       → Dig deeper each round │
│                                    → Proceed after round 3  │
│                                                              │
│   Feel: Friendly mentor            Feel: Tough senior       │
│   Question: "What is X?"           Question: "Why X? Justify" │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Target Users

```
- "I want to become a real senior"
- "I want to truly understand, not just take code from AI"
- "I want to answer 'why did you do it this way?' fluently in interviews"
- "I want to develop critical thinking while vibe coding"
```

#### Example: Success in Round 1

```
Developer: "Implement Redis caching"

Claude: "[Round 1/3] 🤔
I'm going to use Cache-Aside. Why not Write-Through?
What's your reasoning?"

─────────────────────────────────────────────────────────────

Developer: "95% reads, so Cache-Aside is efficient, and
a few seconds of stale data is acceptable for this use case"

─────────────────────────────────────────────────────────────

Claude: "Perfect reasoning! ✅ (Round 1 success)

• Considered read/write ratio ✓
• Reflected business requirements ✓

This is senior-level thinking. Implementing now!"

[generates code]
```

#### Example: Pushed to Round 3

```
Developer: "Implement JWT authentication"

Claude: "[Round 1/3] 🤔
Why JWT instead of session-based auth?"

─────────────────────────────────────────────────────────────

Developer: "Doesn't everyone use JWT these days?"

─────────────────────────────────────────────────────────────

Claude: "[Round 2/3] 🤔
'Everyone uses it' isn't a justification.
Think about JWT's tradeoffs:
- Pros: stateless, easy horizontal scaling
- Cons: hard to invalidate tokens

What's the specific reason JWT is right for THIS project?"

─────────────────────────────────────────────────────────────

Developer: "Um... for scaling?"

─────────────────────────────────────────────────────────────

Claude: "[Round 3/3] 🤔
Getting warmer! Be more specific:
- Is this a microservice architecture?
- Do you need auth across multiple servers?
- Is running shared session storage (Redis) a burden?"

─────────────────────────────────────────────────────────────

Developer: "I'm not sure..."

─────────────────────────────────────────────────────────────

Claude: "That's okay! 📚 Thinking through 3 rounds IS learning.

Let me summarize:

**When JWT is right:**
• Microservices (auth between services)
• Need horizontal scaling (avoid session sharing cost)
• Mobile apps (headers instead of cookies)

**When sessions are better:**
• Single server
• Need instant logout (admin dashboards)
• Minimize token theft risk

If this is single server + web, sessions could be a good choice too.
I'll implement JWT for now!"

[generates code]

→ Recorded: jwt - needed explanation after round 3 ⚠️
```

#### Senior Mode Variants

| Variant | Behavior | When to Use |
|---------|----------|-------------|
| **Senior (Full)** | Up to 3 rounds of pushing. Explains after 3 failed rounds. | Maximum learning |
| **Senior Light** | Presents counterarguments but proceeds after round 1 | Get feedback without blocking |

#### Senior Mode vs Interview Prep

| Aspect | Senior Mode | Interview Prep |
|--------|-------------|----------------|
| When | During real coding | Scheduled practice |
| Purpose | Build critical thinking | Practice answering |
| Flow | Justify → code generation | Q&A repetition |
| Feedback | Immediate | Summary evaluation |

#### Recording

```
Senior Mode Records:
┌────────────────────┬────────┬─────────────────────┐
│ Concept            │ Rounds │ Result              │
├────────────────────┼────────┼─────────────────────┤
│ cache-aside        │ 1      │ ✅ Round 1 success  │
│ jwt                │ 3      │ ⚠️ Needed explanation│
│ kubernetes-hpa     │ 2      │ ✅ Round 2 success  │
│ database-indexing  │ 3      │ ⚠️ Needed explanation│
└────────────────────┴────────┴─────────────────────┘

→ Interview prep report:
  "jwt, database-indexing need justification practice"
```

#### Why "Senior" Mode?

```
Junior: "Use X" → "Why?" → "Because it's popular"
Senior: "Use X" → "Why?" → "For this situation, X beats Y because..."

Senior Mode trains the second way of thinking.
```

---

## 5. User Scenarios

### Scenario 1: Natural Conversational Learning (After Mode)

```
Developer: "Implement Redis caching for user API"

Claude: [generates caching code]

"Done! Implemented Redis caching with Cache-Aside pattern,
TTL set to 1 hour.

By the way, do you know what caching strategies exist and
which one I just used?"

─────────────────────────────────────────────────────────────

Developer: "Hmm... if not in cache, fetch from DB and store?"

─────────────────────────────────────────────────────────────

Claude: "Exactly! That's Cache-Aside (also called Lazy Loading).

There are other approaches:

• Write-Through: Update cache and DB together on writes
  → Pro: Cache always consistent
  → Con: Slower writes

• Write-Behind: Update cache first, DB asynchronously
  → Pro: Fast writes
  → Con: Data loss risk on failure

One more - Cache-Aside can have a problem called
'Cache Stampede'. Ever heard of it?"

─────────────────────────────────────────────────────────────

Developer: "No, what's that?"

─────────────────────────────────────────────────────────────

Claude: "When cache expires and 1000 requests come in at once,
they ALL hit the database. Could crash your DB.

Solutions:
• Mutex Lock: Only one request regenerates cache
• Early Refresh: Refresh before actual expiration

Not critical now, but worth knowing as traffic grows.
I can implement stampede protection if you need!"
```

**Point:** Learning through natural conversation, not quizzes

### Scenario 2: When Busy + Report Usage (Realistic Scenario)

```
[Monday - Sprint starts]
Developer: "/learn off"
VibeLearning: "Learning mode Off. Recording continues."
→ No questions all week

[Mon-Thu: Working in Off mode]
- No questions, no interruption
- But concepts are being recorded:
  • JWT refresh token (3x)
  • Redis caching (2x)
  • Kubernetes deployment (1x)
  • Rate limiting (1x)

[Friday lunch]
Developer: "/learn report"

Claude: "📊 This Week's Learning Report

This week summary:
- Concepts covered: 7
- Questions answered: 0 (Off mode)

🔴 Reinforcement recommended:
• JWT refresh token - appeared 3x, not explored
  → How about reviewing token refresh strategy?

💡 Passed by:
• Rate limiting - Used Token Bucket algorithm,
  Do you know the difference from Leaky Bucket?

Run /learn review when you have time!"

Developer: "I'll look at it over the weekend"
→ Save report as md: /learn report --save
```

**Key:**
- Even in Off mode, **recording continues** → Reports available
- **Zero disruption** to coding flow
- **Async learning** with reports when you have time
- Skip = Failure ❌, Skip = Not Now ✅

### Scenario 3: Progressive Depth Experience

**Week 1:**
```
Claude: "Do you know what pattern I used?" (Level 1)
Developer: "Cache-Aside"
→ Level 1 achieved
```

**Week 3:**
```
Claude: "You know Cache-Aside, let me ask:
        When would you use Write-Through instead?" (Level 3)
Developer: "Slower writes but always consistent?"
→ Level 3 achieved
```

**Week 6:**
```
Claude: "This feed could get thousands of requests per second.
        What happens when cache expires?" (Level 4)
Developer: "Cache Stampede? Prevent with mutex lock?"
→ Level 4 achieved
```

### Scenario 4: Before Mode (Learning New Tech)

```
Developer: [Enables Before Mode]
Developer: "Implement JWT authentication"

─────────────────────────────────────────────────────────────

Claude: "Before implementing, let me check on JWT.

What's the key difference between JWT and session-based auth?

(Say 'just implement it' to skip!)"

─────────────────────────────────────────────────────────────

Developer: "JWT is stateless... no need to store sessions on server?"

─────────────────────────────────────────────────────────────

Claude: "Exactly! No server-side session storage means
easier horizontal scaling.

One tradeoff though - once issued, you can't easily
invalidate a JWT (unlike sessions you just delete).
That's why we'll implement refresh tokens and token blacklist.

Now I'll implement the auth system."

[generates code]
```

**Before Mode Design Philosophy:**
- Never blocks
- "Just implement it" proceeds immediately
- Wrong answer → Explain first, then still generate code
- Like a mentor checking before diving in, not an exam

---

## 6. Architecture

### Design Principle: LLM and MCP Role Separation

**Core Insight:** MCP server focuses on deterministic computation, while LLM (host) handles natural language processing.

```
┌─────────────────────────────────────────────────────────────┐
│                   Role Separation Principle                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Host (Claude) does:              MCP does:                │
│   ─────────────────────            ──────────────────       │
│   • Code → Concept extraction      • Store learning records │
│   • Question generation            • SM-2 calculation       │
│   • Natural language evaluation    • Statistics queries     │
│   • Code insights generation       • Review scheduling      │
│   • Conversation flow              • Fatigue management     │
│                                    • Level tracking         │
│                                                              │
│   ⚠️ Non-deterministic, LLM needed  ✅ Deterministic, reproducible │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Why this separation:**

| Task | If LLM does it | If MCP does it |
|------|----------------|----------------|
| "This code uses Cache-Aside" | ✅ Context understanding | ❌ Limited pattern matching |
| Calculate "review in 7 days" | ❌ Different answers each time | ✅ Always same answer |
| Judge "partial answer" | ✅ Semantic understanding | ❌ Keyword matching only |
| "5 concepts due today" | ❌ No DB access | ✅ SQL query |

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Coding Tools (Host)                    │
│         (Claude Code / Cursor / Windsurf)                   │
├─────────────────────────────────────────────────────────────┤
│  Host Responsibilities:                                      │
│  • Code analysis → Concept identification                   │
│  • Question generation (using MCP templates/levels)         │
│  • Answer evaluation → Record results to MCP                │
│  • User conversation flow management                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ MCP Protocol
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 VibeLearning MCP Server                      │
├─────────────────────────────────────────────────────────────┤
│  MCP Responsibilities:                                       │
│  • Deterministic calculations (SM-2, stats)                 │
│  • Data storage/retrieval                                   │
│  • Fatigue-based question decision                          │
│  • Concept level/template provision                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    SM-2      │  │   Fatigue    │  │    Stats     │       │
│  │  Scheduler   │  │   Manager    │  │  Calculator  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Concept    │  │    Mode      │  │   Record     │       │
│  │   Database   │  │   Manager    │  │   Storage    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        SQLite                                │
│              ~/.vibe-learning/learning.db                    │
└─────────────────────────────────────────────────────────────┘
```

### MCP Tools (Simplified Design)

MCP handles **only numeric calculations and storage**. 9 core tools:

| Tool | Role |
|------|------|
| `should_ask_question` | Fatigue check |
| `get_concept_level` | Query concept level |
| `record_learning` | Record result + SM-2 |
| `get_stats` | Learning stats (SQL GROUP BY) |
| `get_report_data` | Report generation data |
| `get_unknown_unknowns` | Unknown Unknowns query ← NEW |
| `get_due_reviews` | Concepts needing review |
| `get_mode` | Query current mode |
| `set_mode` | Set mode (called by Plugin) |

```python
@mcp.tool()
async def should_ask_question() -> dict:
    """
    Fatigue check. OK to ask now?

    Returns:
        {
            "should_ask": true,
            "reason": "18 min since last question",
            "pending_reviews": 3,       -- concepts due for review
            "consecutive_skips": 0,     -- consecutive skip count
            "paused_until": null        -- pause expiration (null if not paused)
        }

    should_ask=false when:
        - consecutive_skips >= 2 (triggers 1-hour auto-pause)
        - paused_until is in the future
        - cooldown active (< 15 min since last question)
    """

@mcp.tool()
async def get_concept_level(concept_id: str) -> dict:
    """
    Get concept level. Auto-creates if not exists (level=1).

    Args:
        concept_id: Freely generated by host LLM (e.g., "cache-aside")
                    Normalization: lowercase, spaces→hyphens

    Returns:
        {
            "concept_id": "cache-aside",
            "current_level": 2,
            "total_attempts": 5,
            "last_seen": "2026-01-05"
        }
    """

@mcp.tool()
async def record_learning(
    concept_id: str,
    level: int,
    result: Literal["correct", "partial", "incorrect", "skipped"]
) -> dict:
    """
    Record learning result + SM-2 calculation.

    Returns:
        {
            "recorded": true,
            "new_level": 3,
            "next_review": "2026-01-13",
            "message": "Level 3 achieved!"
        }
    """

@mcp.tool()
async def get_stats(period: str = "month") -> dict:
    """
    Query learning statistics. SQL GROUP BY for per-concept stats.

    Args:
        period: "week", "month", "all"

    Returns:
        {
            "period": "month",
            "summary": {
                "total_concepts": 42,
                "total_attempts": 128,
                "correct_rate": 0.73,
                "avg_level": 2.6
            },
            "by_concept": [
                {
                    "concept_id": "cache-aside",
                    "current_level": 3,
                    "attempts": 5,
                    "correct_rate": 0.8,
                    "last_seen": "2026-01-05"
                },
                ...
            ],
            "streak_days": 12
        }

    SQL example:
        SELECT concept_id,
               current_level,
               COUNT(*) as attempts,
               AVG(CASE WHEN result='correct' THEN 1.0 ELSE 0.0 END) as correct_rate
        FROM learning_records lr
        JOIN concept_progress cp ON lr.concept_id = cp.concept_id
        WHERE created_at > date('now', '-30 days')
        GROUP BY concept_id
        ORDER BY attempts DESC
    """

@mcp.tool()
async def get_report_data(
    period: str = "week",
    area: Optional[str] = None
) -> dict:
    """
    Get detailed data for report generation.
    Host LLM uses this data to generate natural language reports.

    Args:
        period: "week", "month", "all"
        area: Specific area only (e.g., "auth", "caching")

    Returns:
        {
            "period": "2026-01-01 ~ 2026-01-07",
            "summary": {
                "concepts_touched": 12,
                "new_concepts": 5,
                "repeated_concepts": 7,
                "questions_asked": 10,
                "questions_answered": 8,
                "skip_rate": 0.2,
                "avg_level_start": 2.3,
                "avg_level_end": 2.6
            },
            "weak_areas": [
                {
                    "area": "auth",
                    "concepts": ["jwt-refresh", "token-rotation"],
                    "appearances": 4,
                    "avg_level": 1.5,
                    "signals": [
                        "Appeared 3x, no level change",
                        "Skipped 2x"
                    ]
                }
            ],
            "strong_areas": [
                {
                    "area": "database",
                    "concepts": ["indexing", "n-plus-one"],
                    "avg_level": 3.5,
                    "correct_rate": 0.9
                }
            ],
            "unknown_unknowns": [
                {
                    "concept_id": "connection-pooling",
                    "context": "Appeared in DB connection code",
                    "first_seen": "2026-01-05",
                    "explored": false
                }
            ],
            "trends": {
                "vs_last_period": {
                    "concepts_touched": "+3",
                    "avg_level": "+0.3",
                    "correct_rate": "+0.12"
                }
            },
            "skipped_concepts": [
                {
                    "concept_id": "kubernetes-hpa",
                    "skip_count": 3,
                    "last_skipped": "2026-01-06"
                }
            ]
        }

    Host LLM responsibilities:
    - Generate natural language report from this data
    - Recommend learning based on weak_areas
    - Surface "what you didn't know you didn't know" via unknown_unknowns
    - Generate expected interview questions
    """

@mcp.tool()
async def get_unknown_unknowns(
    period: str = "month",
    limit: int = 10
) -> dict:
    """
    Query Unknown Unknowns - concepts passed by without exploration.

    Args:
        period: "week", "month", "all"
        limit: Max items to return

    Returns:
        {
            "period": "month",
            "unknowns": [
                {
                    "concept_id": "cache-stampede",
                    "related_to": "cache-aside",
                    "appearances": 5,
                    "explored": false,
                    "priority": "high",
                    "context": "Appeared during Redis caching implementation",
                    "why_important": "Can kill DB under high traffic"
                },
                {
                    "concept_id": "connection-pooling",
                    "related_to": "database",
                    "appearances": 4,
                    "explored": false,
                    "priority": "high",
                    "context": "Appeared in DB connection code",
                    "why_important": "May need connection management optimization"
                },
                ...
            ],
            "total_count": 12,
            "explored_this_period": 3
        }

    Priority calculation:
        high: appearances >= 3 AND explored = false
        medium: appearances >= 2 AND explored = false
        low: appearances = 1 AND explored = false
    """

@mcp.tool()
async def get_due_reviews(limit: int = 5) -> list:
    """
    Get concepts needing review.

    Returns:
        [
            {
                "concept_id": "jwt-refresh-token",
                "current_level": 2,
                "days_overdue": 3,
                "last_result": "partial"
            },
            ...
        ]
    """

@mcp.tool()
async def get_mode() -> dict:
    """
    Query current learning mode.

    Returns:
        {
            "mode": "after",           -- "after", "before", "off", "senior", "senior_light"
            "paused_until": null,      -- pause end time (null if not paused)
            "focus_area": null         -- focus area (null if none)
        }
    """

@mcp.tool()
async def set_mode(
    mode: Literal["after", "before", "off", "senior", "senior_light"],
    paused_until: Optional[datetime] = None,
    focus_area: Optional[str] = None
) -> dict:
    """
    Set learning mode. Called by Plugin.

    Returns:
        {
            "updated": true,
            "mode": "senior",
            "message": "Senior mode activated. Justify your decisions!"
        }
    """
```

**Core Design Principles:**

```
┌─────────────────────────────────────────────────────────────┐
│              Template-Free Design                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ❌ Old: MCP stores question_templates, key_points          │
│     → Cold Start problem (450 items to create manually)     │
│                                                              │
│  ✅ New: MCP stores only levels and records                 │
│     → Question generation: Host LLM creates from summary    │
│     → Answer evaluation: Host LLM judges directly           │
│     → No Cold Start                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Free concept_id Generation:**

```
Host LLM: "This code uses Cache-Aside pattern"
        → concept_id = "cache-aside" (freely generated)

MCP: get_concept_level("cache-aside")
   → If not exists: auto-create, return level=1
   → If exists: return current level

Duplicate problem?
→ "cache-aside" and "lazy-loading" same concept? Doesn't matter
→ Learning both is fine. Learning opportunities > perfect normalization
```

### Host LLM Responsibilities

MCP provides only numbers. The host creates the actual learning experience:

```
┌─────────────────────────────────────────────────────────────┐
│                   Host Responsibilities                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Generate Task Summary (existing pattern)                │
│     "📋 Added Redis caching with Cache-Aside..."           │
│                                                              │
│  2. Extract Key Concepts from Summary                       │
│     "Cache-Aside" → concept_id = "cache-aside"              │
│                                                              │
│  3. Generate Level-Appropriate Questions Directly           │
│     Level 1: "Do you know what Cache-Aside is?"             │
│     Level 3: "When would you use Write-Through instead?"    │
│                                                              │
│  4. Evaluate Answers Directly                               │
│     "Check cache first, then DB if miss" → correct          │
│     When in doubt, be generous (goal is learning)           │
│                                                              │
│  5. Natural Conversation                                    │
│     Append question naturally to summary                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Models (Simplified)

```python
@dataclass
class LearningRecord:
    id: int
    concept_id: str  # Freely generated by host LLM
    timestamp: datetime
    level: int  # 1-5
    result: str  # "correct", "partial", "incorrect", "skipped"

@dataclass
class ConceptProgress:
    concept_id: str  # PK, auto-created
    current_level: int  # 1-5
    easiness_factor: float  # SM-2 (default 2.5)
    interval_days: int
    next_review: date
    total_attempts: int
    correct_count: int

# Concept table unnecessary - host LLM generates freely
# question_templates unnecessary - host LLM generates directly
# key_points unnecessary - host LLM evaluates directly
```

### Integration Flow: Task Summary Based Sequence

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        After Mode Complete Sequence                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User                      Host LLM                    VibeLearning MCP  │
│    │                           │                            │           │
│    │ "Implement Redis caching" │                            │           │
│    │ ─────────────────────────>│                            │           │
│    │                           │                            │           │
│    │                           │ [Perform task]             │           │
│    │                           │ - Modify user.ts           │           │
│    │                           │ - Create redis.ts          │           │
│    │                           │ - Add tests                │           │
│    │                           │                            │           │
│    │                           │ [Generate task summary]    │           │
│    │                           │ "Cache-Aside pattern..."   │           │
│    │                           │                            │           │
│    │                           │ should_ask_question()      │           │
│    │                           │ ──────────────────────────>│           │
│    │                           │ {"should_ask": true}       │           │
│    │                           │ <──────────────────────────│           │
│    │                           │                            │           │
│    │                           │ [Extract concept from      │           │
│    │                           │  summary: "cache-aside"]   │           │
│    │                           │                            │           │
│    │                           │ get_concept_level          │           │
│    │                           │ ("cache-aside")            │           │
│    │                           │ ──────────────────────────>│           │
│    │                           │ {"current_level": 1}       │           │
│    │                           │ <──────────────────────────│           │
│    │                           │                            │           │
│    │ "Done!                    │                            │           │
│    │  📋 Task Summary: ...     │                            │           │
│    │  💡 Do you know what      │                            │           │
│    │     Cache-Aside is?"      │                            │           │
│    │ <─────────────────────────│                            │           │
│    │                           │                            │           │
│    │ "Check cache first,       │                            │           │
│    │  then DB if miss"         │                            │           │
│    │ ─────────────────────────>│                            │           │
│    │                           │                            │           │
│    │                           │ [Evaluate: correct]        │           │
│    │                           │                            │           │
│    │                           │ record_learning            │           │
│    │                           │ ("cache-aside", 1, correct)│           │
│    │                           │ ──────────────────────────>│           │
│    │                           │ {"new_level": 2}           │           │
│    │                           │ <──────────────────────────│           │
│    │                           │                            │           │
│    │ "Correct! Next time I'll  │                            │           │
│    │  ask about other patterns"│                            │           │
│    │ <─────────────────────────│                            │           │
│    │                           │                            │           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Skip Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Skip Handling Sequence                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User                      Host LLM                    VibeLearning MCP  │
│    │                           │                            │           │
│    │ "Skip" / (ignores)        │                            │           │
│    │ ─────────────────────────>│                            │           │
│    │                           │                            │           │
│    │                           │ record_learning            │           │
│    │                           │ ("cache-aside", 1, skipped)│           │
│    │                           │ ──────────────────────────>│           │
│    │                           │ {"consecutive_skips": 2}   │           │
│    │                           │ <──────────────────────────│           │
│    │                           │                            │           │
│    │ "Got it! Taking a break   │                            │           │
│    │  for now."                │                            │           │
│    │ <─────────────────────────│                            │           │
│    │                           │                            │           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Before Mode Sequence

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Before Mode Sequence                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User                      Host LLM                    VibeLearning MCP  │
│    │                           │                            │           │
│    │ "Implement JWT auth"      │                            │           │
│    │ ─────────────────────────>│                            │           │
│    │                           │                            │           │
│    │                           │ [Check Before mode active] │           │
│    │                           │                            │           │
│    │                           │ get_concept_level("jwt")   │           │
│    │                           │ ──────────────────────────>│           │
│    │                           │ {"current_level": 1}       │           │
│    │                           │ <──────────────────────────│           │
│    │                           │                            │           │
│    │ "Before implementing,     │                            │           │
│    │  what's the key diff      │                            │           │
│    │  between JWT and          │                            │           │
│    │  session auth?            │                            │           │
│    │  ('just implement it'     │                            │           │
│    │   to skip!)"              │                            │           │
│    │ <─────────────────────────│                            │           │
│    │                           │                            │           │
│    │ "stateless, no server     │                            │           │
│    │  session storage needed"  │                            │           │
│    │ ─────────────────────────>│                            │           │
│    │                           │                            │           │
│    │                           │ [Evaluate: correct]        │           │
│    │                           │                            │           │
│    │                           │ record_learning            │           │
│    │                           │ ("jwt", 1, correct)        │           │
│    │                           │ ──────────────────────────>│           │
│    │                           │ {"new_level": 2}           │           │
│    │                           │ <──────────────────────────│           │
│    │                           │                            │           │
│    │ "Exactly! Now let me      │                            │           │
│    │  implement it."           │                            │           │
│    │ <─────────────────────────│                            │           │
│    │                           │                            │           │
│    │                           │ [Perform task]             │           │
│    │                           │                            │           │
└─────────────────────────────────────────────────────────────────────────┘
```

**Before Mode Key Points:**
- Check understanding before implementation
- "just implement it" skips immediately (never blocks)
- Wrong answer → explain first, then still implement

### Host Integration Guide (CLAUDE.md Example)

```markdown
# VibeLearning Integration Guide

## Trigger Point

**After task completion, when generating summary**, perform learning check.

## Flow

1. **Task complete → Generate summary** (existing pattern)

2. **Extract key concepts from summary**
   - "Applied Cache-Aside pattern" → concept_id = "cache-aside"
   - Normalization: lowercase, spaces→hyphens

3. **Check if question appropriate**
   ```
   Call should_ask_question()
   → If should_ask=false, deliver summary only
   ```

4. **Check level**
   ```
   Call get_concept_level("cache-aside")
   → {"current_level": 1}
   ```

5. **Generate level-appropriate question directly**
   - Level 1: "Do you know what ~ is?"
   - Level 2: "How does ~ work?"
   - Level 3: "When would you use ~ instead?"
   - Level 4: "What's the problem with ~?"
   - Level 5: "Design ~ for me"

6. **Evaluate answer directly**
   - correct: Shows understanding, be generous
   - partial: Right direction but incomplete
   - incorrect: Clearly wrong
   - **Principle: When in doubt, correct**

7. **Record result**
   ```
   Call record_learning("cache-aside", level, result)
   ```

## Append question to summary

```
"Done!

📋 Task Summary:
• Added Redis caching to UserService
• Applied Cache-Aside pattern
• Set TTL to 1 hour

💡 By the way, do you know what Cache-Aside pattern is?"
```

## Notes

- Skip simple tasks (typo fixes, formatting)
- On "skip" or no response, accept immediately, no penalty
- After 2 consecutive skips, 1-hour auto-pause activates
```

### SQLite Schema (Simplified)

```sql
-- concepts table unnecessary (host LLM generates freely)
-- question_templates unnecessary (host LLM generates directly)
-- key_points unnecessary (host LLM evaluates directly)

-- Per-concept progress (auto-created)
CREATE TABLE concept_progress (
    concept_id TEXT PRIMARY KEY,      -- Freely generated by host LLM
    current_level INTEGER DEFAULT 1,
    easiness_factor REAL DEFAULT 2.5, -- SM-2 E-Factor
    interval_days INTEGER DEFAULT 1,
    next_review DATE,
    total_attempts INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning records
CREATE TABLE learning_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concept_id TEXT,
    level INTEGER,
    result TEXT CHECK(result IN ('correct', 'partial', 'incorrect', 'skipped')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session state
CREATE TABLE session_state (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    last_question_at TIMESTAMP,
    consecutive_skips INTEGER DEFAULT 0,
    paused_until TIMESTAMP              -- 1-hour auto-pause expiration
);

-- Mode state (updated when Plugin calls set_mode)
CREATE TABLE mode_state (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    mode TEXT DEFAULT 'after' CHECK(mode IN ('after', 'before', 'off', 'senior', 'senior_light')),
    paused_until TIMESTAMP,
    focus_area TEXT
);

-- Unknown Unknowns tracking (NEW)
CREATE TABLE unknown_unknowns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concept_id TEXT,                      -- Unexplored concept (e.g., cache-stampede)
    related_to TEXT,                       -- Related concept (e.g., cache-aside)
    appearances INTEGER DEFAULT 1,         -- Times related code appeared
    explored BOOLEAN DEFAULT FALSE,        -- Whether explored
    context TEXT,                          -- Context of appearance
    why_important TEXT,                    -- Why important (generated by Host LLM)
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    explored_at TIMESTAMP                  -- When explored (NULL if not)
);

-- Indexes
CREATE INDEX idx_records_concept ON learning_records(concept_id);
CREATE INDEX idx_progress_review ON concept_progress(next_review);
CREATE INDEX idx_unknowns_explored ON unknown_unknowns(explored);
CREATE INDEX idx_unknowns_related ON unknown_unknowns(related_to);
```

### Plugin Architecture

Works with MCP server alone, but **Plugin provides better UX**:

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP vs Plugin Role Separation             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   MCP Server (Deterministic)      Plugin (User Interaction) │
│   ─────────────────────────       ─────────────────────────  │
│   • get_mode / set_mode           • /learn slash commands   │
│   • Mode state storage            • Mode switching UI       │
│   • Fatigue calculation           • Status bar display      │
│   • SM-2 calculation              • Notifications/toasts    │
│   • Stats queries                 • Settings screen         │
│                                                              │
│   ✅ Stateless, pure calculation  ✅ Handles UX             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Plugin Slash Commands:**

```
# Mode Control
/learn              → Show current status + menu
/learn pause        → Pause for 1 hour (calls set_mode)
/learn off          → Turn off learning (recording continues)
/learn before       → Activate Before mode
/learn after        → After mode (default)
/learn senior       → Senior mode (must justify decisions) ← NEW
/learn senior light → Senior light (feedback without blocking) ← NEW
/learn focus auth   → Only ask about auth topics

# Features (Available in all modes)
/learn stats        → Stats dashboard (calls get_stats)
/learn report       → Weekly learning report (calls get_report_data)
/learn report month → Monthly report
/learn report auth  → Auth area only report
/learn report --save → Save as md file
/learn unknowns     → Unknown Unknowns dashboard (calls get_unknown_unknowns) ← NEW
/learn unknowns --save → Save as md file
/learn review       → Start pending reviews (calls get_due_reviews)
/learn interview    → Start interview practice
```

**Report Generation Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│                    /learn report execution                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Plugin: Parse command                                   │
│       ↓                                                     │
│  2. MCP: Call get_report_data(period="week")               │
│       ↓                                                     │
│  3. MCP: Aggregate learning records, analyze patterns,     │
│          return JSON                                        │
│       ↓                                                     │
│  4. Plugin → Host LLM: "Generate report from this data"    │
│       ↓                                                     │
│  5. Host LLM: Generate natural language report             │
│       ↓                                                     │
│  6. Display to user (or save as md if --save)              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Why Separate:**

| MCP Only | MCP + Plugin |
|----------|--------------|
| Host LLM manages mode | User controls directly |
| No commands | `/learn` slash commands |
| No status bar | Shows current mode |
| Settings via dialog | Settings UI |

**Works Without Plugin:**

```
User: "Turn off learning mode"
Claude: (calls set_mode("off"))
       "Learning mode turned off. Let me know when you want it back."
```

Plugin makes it more convenient, but MCP alone works through host LLM.

---

## 7. Tech Stack

| Component | Technology | Reason |
|-----------|------------|--------|
| Language | Python 3.11+ | MCP SDK support, ecosystem |
| MCP | FastMCP | Clean API |
| DB | SQLite | Local, no setup, deterministic queries |
| Algorithm | SM-2 | Same as Anki, proven |

**Dependencies:**

```
fastmcp>=0.1.0
pydantic>=2.0
sqlite3 (stdlib)
```

---

## 8. Competitive Analysis

### Core Differentiation: Learning During Vibe Coding

VibeLearning's unique differentiation is **"learning happens during vibe coding"**.

```
┌─────────────────────────────────────────────────────────────┐
│                    When Learning Happens                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Anki          After coding → Open app → Review cards       │
│                (Requires separate time, tedious)             │
│                                                              │
│  Rember        During chat → "Remember this" → Create card  │
│                (Not for coding agents, manual trigger)       │
│                                                              │
│  VibeLearning  While coding → Auto question → Learning      │
│                (Within vibe coding workflow)                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Why this matters:**

```
Reality: "I'll review with Anki later" → That "later" never comes
Reality: "I'll study when I have time" → That time never comes

VibeLearning: Learn naturally while vibe coding
             Grow without dedicating extra time
```

### Different Category: AI Coding Agent Plugin

VibeLearning is an **MCP/plugin for AI coding agents like Claude Code and OpenCode**.

```
┌─────────────────────────────────────────────────────────────┐
│                      Category Comparison                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tool              Category                Learning during  │
│                                            coding?          │
│  ───────────────   ───────────────────   ─────────────────  │
│  Anki              Generic flashcard app  ❌ Separate app   │
│  Rember MCP        For Claude Desktop     ❌ Not coding agent│
│  LeetCode          Algorithm learning site❌ Separate from work│
│  VibeLearning      Coding agent plugin    ✅ During vibe coding│
│                                                              │
│  Where VibeLearning runs:                                    │
│  • Claude Code (Anthropic official CLI)                     │
│  • OpenCode (open-source coding agent)                      │
│  • Cursor, Windsurf, etc. (MCP-supporting agents)          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

Comparing with Anki or Rember doesn't make sense. **Different category.**

### claude-mem vs VibeLearning

"Isn't a memory tool like claude-mem enough?"

```
┌─────────────────────────────────────────────────────────────┐
│                    Key Difference                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  claude-mem: "You did this work" (records)                  │
│  VibeLearning: "Here's what you don't know" (verification)  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Real scenario:**

```
[To claude-mem]
User: "What should I learn?"
→ "Spring REST Docs, Feign Client deep dive..."
   (Recommends studying things you already know ❌)

[To VibeLearning]
User: "What should I learn?"
→ "Cache Stampede - appeared 3x, skipped every time"
→ "JWT invalidation - only got partial on the question"
   (Only what you actually don't know ✅)
```

| Feature | claude-mem | VibeLearning |
|---------|------------|--------------|
| Work history | ✅ What you did | ✅ |
| Understanding verification | ❌ Doesn't know if you know | ✅ Verified by questions |
| Learning recommendations | ❌ Can only guess | ✅ Data-driven |
| Review timing | ❌ Doesn't know when | ✅ SM-2 calculated |

**Key:** claude-mem records "did it", VibeLearning verifies "knows it".

### Claude Alone vs VibeLearning

Comparison within the same coding agent. "Can't I just ask Claude?"

```
┌─────────────────────────────────────────────────────────────┐
│              Claude Alone vs VibeLearning MCP                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  What Claude can do alone                                    │
│  ─────────────────────────────────────────────────────────  │
│  ✅ "Explain this code" → Explains                          │
│  ✅ "Quiz me" → Generates quiz                              │
│  ✅ "What's Cache-Aside?" → Answers                         │
│                                                              │
│  What Claude can't do alone (no cross-session memory)       │
│  ─────────────────────────────────────────────────────────  │
│  ❌ "You learned JWT 3 weeks ago, want to review?"          │
│  ❌ "You've done caching 5 times but still Level 2"         │
│  ❌ "This month's accuracy 73%, up 12% from last month"     │
│  ❌ "You skip every time JWT comes up"                      │
│  ❌ "Auth area stagnant for 3 weeks"                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Differences:**

| Situation | Claude Alone | VibeLearning |
|-----------|--------------|--------------|
| "What did I learn 3 weeks ago?" | Doesn't know | Has records |
| "Anything to review?" | Doesn't know | SM-2 tells you |
| "How good am I at caching?" | "You seem good" (guess) | "78%, Level 3" (data) |
| "Why am I not improving at auth?" | Doesn't know | "You skip JWT every time" |
| "Am I growing?" | "You're doing great" (comfort) | "+23% over 3 months" (evidence) |

Claude provides **one-time insights**, VibeLearning provides **cumulative learning + reminders**.

### Unknown Unknowns: What You Don't Know You Don't Know

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│   Known Unknowns               Unknown Unknowns             │
│   (What you know               (What you don't know         │
│    you don't know)              you don't know)             │
│   ┌─────────────┐              ┌─────────────────────┐      │
│   │             │              │                      │      │
│   │  "What's    │              │  If you don't know   │      │
│   │   JWT?"     │              │  "Cache Stampede",   │      │
│   │  You can    │              │  you can't even      │      │
│   │  ask        │              │  ask about it        │      │
│   │             │              │                      │      │
│   └─────────────┘              └─────────────────────┘      │
│                                       ↑                      │
│                                 VibeLearning                 │
│                                 catches these                │
│                                                              │
│   VibeLearning: "You used Cache-Aside.                      │
│                  Do you know Cache Stampede?"               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### The Real Competitors

VibeLearning's real competitors aren't other tools:

```
1. "Just take the code and move on"
   → Most people don't even ask. If it works, next task.

2. "I'll study later"
   → That "later" never comes

3. "Do nothing" (inertia)
   → The biggest competitor
```

VibeLearning's value:
- **"Take code + learn" instead of "take code and done"**
- **"Now, while coding" instead of "later"**

### Positioning

```
┌─────────────────────────────────────────────────────────────┐
│           Position in AI Coding Agent Ecosystem             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Claude Code / OpenCode / Cursor                            │
│  └─ Code generation (fast, convenient)                      │
│     └─ Problem: Don't know if developer is growing          │
│                                                              │
│  + VibeLearning MCP                                          │
│    └─ Code generation + learning check + review reminder    │
│       + growth tracking                                      │
│       └─ Compensates for vibe coding's weakness             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### One-Line Summary

```
VibeLearning = MCP that adds a "learning layer" to AI coding agents

Maintain vibe coding speed,
while ensuring developer growth.
```

---

## 9. Roadmap

### Phase 0: Proof of Concept (3 days)

**Goal:** Validate that core idea works

**Scope:**
- [ ] Basic MCP server structure (6 tools)
- [ ] SQLite schema implementation (3 tables)
- [ ] SM-2 algorithm implementation
- [ ] CLAUDE.md integration guide
- [ ] Basic recording functionality (works even in Off mode)

**Success Criteria:**
- Use it 5 times yourself
- Find it useful at least 3 times
- Not annoying

### Phase 1: MVP (1 week)

**Goal:** Minimum feature set for daily use

**Scope:**
- [ ] Fatigue management (should_ask_question)
- [ ] Level-based question flow (get_concept_level → host LLM generates question)
- [ ] Learning records and review schedule (record_learning)
- [ ] Basic `/learn stats` (get_stats)
- [ ] **`/learn report` weekly report** (get_report_data)
- [ ] After mode complete
- [ ] Off mode + report combo validation

**Not in MVP:**
- ❌ Before mode
- ❌ Interview prep
- ❌ Per-area detailed grouping
- ❌ Report md file save (--save)

### Phase 2: Complete Learning Loop (1 week)

**Goal:** Review system + Unknown Unknowns visualization

**Scope:**
- [ ] Due review queries (get_due_reviews)
- [ ] Per-area stats (host LLM passes tags)
- [ ] Advanced fatigue auto-adjustment
- [ ] Skip pattern analysis
- [ ] **Monthly report** (/learn report month)
- [ ] **Report md save** (--save option)
- [ ] **`/learn unknowns` dashboard** (get_unknown_unknowns) ← NEW
- [ ] Related concept linking logic (cache-aside → cache-stampede etc.)
- [ ] Exploration prompt flow implementation

### Phase 3: Complete (1 week)

**Goal:** Ready for public

**Scope:**
- [ ] Before mode
- [ ] **Senior mode** (/learn senior, /learn senior light) ← NEW
- [ ] Interview prep feature (/learn interview)
- [ ] **Per-area report** (/learn report auth)
- [ ] pip package
- [ ] Documentation and examples

### Timeline

```
Phase 0: 3 days  ███
Phase 1: 1 week  ███████
Phase 2: 1 week  ███████
Phase 3: 1 week  ███████

Internal use ready: After Phase 1 (~10 days)
Public ready: After Phase 3 (~4 weeks)
```

---

## 10. Open Questions

### Product

1. **Gamification**: Add streaks, badges? (Could backfire if overdone)
2. **Team features**: Needed? What format?
3. **Multi-language**: Separate question generation for EN/KO?

### Technical

1. **Privacy**: All local only? Optional cloud sync?
2. **Multi-project**: Separate learning records per project?
3. **Host compatibility**: Need testing on Cursor, Windsurf beyond Claude Code

### Market

1. **Launch platform**: Product Hunt? Hacker News?
2. **Name**: Keep VibeLearning? Different name?

### Already Decided (Reference)

| Question | Decision | Rationale |
|----------|----------|-----------|
| Concept database | Host LLM free generation | Solves Cold Start |
| Question generation | Host LLM direct generation | Removes template maintenance burden |
| Answer evaluation | Host LLM direct evaluation | Needs semantic understanding |
| Trigger timing | After task summary | Natural flow |
| Session definition | Per project | Based on claude.json |

---

## Next Steps

1. [ ] Start Phase 0: Basic MCP server structure (9 tools)
2. [ ] SQLite schema implementation and SM-2 algorithm
3. [ ] Unknown Unknowns table and tracking logic
4. [ ] Write CLAUDE.md integration guide
5. [ ] Use it for 1 week (dogfooding)
6. [ ] Iterate based on feedback

---

*Last updated: January 2026*
