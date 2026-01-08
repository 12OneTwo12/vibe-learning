# VibeLearning Integration Guide

VibeLearning MCP 서버를 다양한 AI Code Agent에 연동하는 방법입니다.

## MCP 서버 설치

```bash
# 글로벌 설치
npm install -g vibe-learning-mcp

# 또는 로컬 빌드
git clone https://github.com/your-repo/vibe-learning.git
cd vibe-learning
npm install && npm run build
```

---

## Claude Code

### MCP 서버 등록
```bash
claude mcp add vibe-learning -- node /path/to/vibe-learning/dist/index.js
```

### 프로젝트 설정 (CLAUDE.md)
```markdown
# VibeLearning

작업 완료 후 should_ask_question을 호출하여 학습 질문 여부를 확인하고,
적절한 경우 개념 질문을 진행합니다.
```

---

## Cursor

### MCP 설정 (~/.cursor/mcp.json)
```json
{
  "mcpServers": {
    "vibe-learning": {
      "command": "node",
      "args": ["/path/to/vibe-learning/dist/index.js"]
    }
  }
}
```

### 프로젝트 설정 (.cursorrules)
```
# VibeLearning Integration

After completing any coding task:
1. Call should_ask_question to check if learning is appropriate
2. If shouldAsk is true, identify a key concept from the work
3. Call get_concept_level to determine the user's current level
4. Ask a level-appropriate question:
   - Level 1: Recognition ("What is X?")
   - Level 2: Understanding ("Why do we need X?")
   - Level 3: Comparison ("How does X differ from Y?")
   - Level 4: Edge cases ("What are the gotchas of X?")
   - Level 5: Architecture ("How would you design X?")
5. Evaluate the answer and call record_learning with the result

When encountering related concepts the user might not know:
- Call record_unknown_unknown to track knowledge gaps
```

---

## Cline (VS Code)

### MCP 설정 (~/.cline/mcp_settings.json)
```json
{
  "mcpServers": {
    "vibe-learning": {
      "command": "node",
      "args": ["/path/to/vibe-learning/dist/index.js"]
    }
  }
}
```

### Custom Instructions
Settings > Cline > Custom Instructions에 추가:

```
After completing tasks, use the vibe-learning MCP tools:
- should_ask_question: Check if it's time for a learning question
- get_concept_level: Get user's level for a concept
- record_learning: Record learning results (correct/partial/incorrect/skipped)

Ask questions that match the user's level (1-5) and respect fatigue limits.
```

---

## Windsurf

### MCP 설정 (~/.windsurf/mcp.json)
```json
{
  "mcpServers": {
    "vibe-learning": {
      "command": "node",
      "args": ["/path/to/vibe-learning/dist/index.js"]
    }
  }
}
```

### Rules (.windsurfrules)
```
Use vibe-learning MCP for spaced repetition learning:
- After tasks: should_ask_question → get_concept_level → ask → record_learning
- Track unknown concepts with record_unknown_unknown
- Respect daily limits (2 questions) and cooldowns (15 min)
```

---

## Continue

### config.json (~/.continue/config.json)
```json
{
  "experimental": {
    "mcpServers": [
      {
        "name": "vibe-learning",
        "command": "node",
        "args": ["/path/to/vibe-learning/dist/index.js"]
      }
    ]
  }
}
```

### System Prompt
```
You have access to vibe-learning MCP tools for spaced repetition learning.
After completing coding tasks, check should_ask_question and engage in
brief learning moments when appropriate.
```

---

## Zed

### settings.json
```json
{
  "language_models": {
    "mcp_servers": {
      "vibe-learning": {
        "command": "node",
        "args": ["/path/to/vibe-learning/dist/index.js"]
      }
    }
  }
}
```

---

## 공통 프롬프트 템플릿

모든 AI Agent에서 사용할 수 있는 표준 프롬프트:

```
## VibeLearning - Spaced Repetition for Vibe Coding

You have access to learning tools via MCP. Use them to help the user learn while coding.

### After Task Completion
1. should_ask_question → Check fatigue limits
2. If shouldAsk=true:
   - Identify a concept from the completed work
   - get_concept_level(concept) → Get current level (1-5)
   - Ask a question matching the level
   - record_learning(concept, level, result)

### Question Levels
- 1 (Recognition): "~가 뭔지 알아?"
- 2 (Understanding): "~가 왜 필요해?"
- 3 (Comparison): "~와 ~의 차이는?"
- 4 (Edge Cases): "~에서 주의할 점은?"
- 5 (Architecture): "~를 설계한다면?"

### Learning Modes (get_mode / set_mode)
- after: Questions after task completion (default)
- before: Questions before implementation
- off: No questions (recording only)
- senior: Deep questioning with persuasion
- senior_light: Light feedback only

### Unknown Unknowns
When you notice related concepts the user might not know:
- record_unknown_unknown(concept, related_to, context, why_important)

### Respect User Flow
- Max 2 questions per day
- 15 minute cooldown between questions
- Stop after 3 consecutive skips
```

---

## 도구 요약

| Tool | Purpose |
|------|---------|
| should_ask_question | 질문 가능 여부 확인 (피로도) |
| get_concept_level | 개념의 현재 레벨 조회 |
| record_learning | 학습 결과 기록 |
| get_stats | 통계 조회 |
| get_report_data | 리포트 데이터 |
| get_unknown_unknowns | 미탐색 개념 목록 |
| record_unknown_unknown | 미탐색 개념 등록 |
| mark_explored | 탐색 완료 표시 |
| get_due_reviews | 복습 필요 개념 |
| get_mode | 현재 모드 조회 |
| set_mode | 모드 변경 |
