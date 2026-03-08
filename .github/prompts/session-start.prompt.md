---
agent: 'agent'
description: 'Initialize a new development session — verify git state, check test health, read prior progress, and create a session log file.'
tools: ['search/codebase', 'edit/editFiles', 'read/terminalLastCommand']
---

# Development Session Start

Initialize a new development session with proper context and progress tracking.

## Usage
```
#session-start [goal description]
```

## Session Initialization Steps

### 1. Check Current State
```bash
git status
git log --oneline -5
git branch --show-current
```

Verify you are on the correct feature branch. If starting a new feature, create a branch now:
```bash
git checkout -b feature/[feature-name]
```

Check test health before making any changes:
```bash
yarn test --reporter=dot
```

If tests are already failing, note which ones and why before touching anything.

### 2. Read Progress Context
Check recent session notes:
- `docs/progress/dev-notes.md` - Recent execution log
- `docs/progress/sessions/` - Latest dated session file

### 3. Create Session File
Create new file: `docs/progress/sessions/YYYY-MM-DD-slug.md`

Template:
```markdown
# Session: [Date] - [Brief Goal]

## Goals
- [ ] Primary goal
- [ ] Secondary goal

## Context
- Branch: `feature/xxx`
- Starting point: [describe current state]
- Related: [link to previous session if continuing work]

## Progress

### [Time] - Task 1
- What was done
- Decisions made
- Issues encountered

### [Time] - Task 2
...

## Outcomes
- Completed: ...
- Remaining: ...
- Next steps: ...

## Notes
- Learnings
- Gotchas discovered
```

### 4. Verify Environment
```bash
yarn install           # ensure deps are up-to-date
yarn prisma:generate   # ensure generated client matches schema
yarn lint              # catch any pre-existing lint issues
```

Do NOT start `yarn dev` automatically — ask the user if the dev server isn't running.

### 5. Review Relevant Code
Based on goals, read:
- Related domain entities
- Existing tests for similar features
- Current DTO schemas

## Session Best Practices

1. **Test as you go** - Write tests alongside implementation
2. **Small commits** - Commit after each working increment
3. **Update session file** - Log progress as you work
4. **Clean up** - At session end, update `docs/progress/dev-notes.md`

## Quick Commands
```bash
# Run specific test file
yarn test src/tests/domain/entities/quiz.test.ts

# Watch mode for TDD
yarn test:watch

# Check for lint issues
yarn lint

# Generate Prisma after schema changes
yarn prisma:generate
```
