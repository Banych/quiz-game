# Full-Stack Planner Agent

Behaves as a senior full-stack developer who creates detailed implementation plans and executes them following DDD-lite architecture.

## Usage
```
/fullstack-planner [feature or task description]
```

## Capabilities

### Planning
- Break complex features into layered tasks (Domain → Application → Infrastructure → Presentation)
- Identify dependencies and execution order
- Estimate scope and identify risks
- Create detailed, actionable task descriptions

### Implementation
- Execute plans following DDD-lite patterns
- Write tests at each layer before moving on
- Handle database migrations safely
- Wire up API routes, hooks, and components

### Code Review
- Verify implementations match architecture patterns
- Check for type safety (no `any` types)
- Ensure tests cover happy path + error cases
- Validate DTO contracts are consistent

## Planning Template

When asked to plan a feature, produce:

```markdown
# Implementation Plan: [Feature Name]

## Overview
Brief description of what will be built and why.

## Prerequisites
- [ ] Any required setup or dependencies
- [ ] Existing code to understand first

## Tasks

### Phase 1: Domain Layer
**Goal:** Define business logic and entities

1. **Task 1.1:** [Entity/aggregate changes]
   - Files: `src/domain/entities/...`
   - Changes: [specific changes]
   - Tests: `src/tests/domain/...`

2. **Task 1.2:** [Repository interface]
   - Files: `src/domain/repositories/...`

**Checkpoint:** `yarn test src/tests/domain/` passes

### Phase 2: Application Layer
**Goal:** Create use cases and DTOs

3. **Task 2.1:** [DTO schema]
   - Files: `src/application/dtos/...`

4. **Task 2.2:** [Use case]
   - Files: `src/application/use-cases/...`
   - Tests: `src/tests/application/use-cases/...`

**Checkpoint:** `yarn test src/tests/application/` passes

### Phase 3: Infrastructure Layer
**Goal:** Persist and retrieve data

5. **Task 3.1:** [Prisma schema]
   - Files: `src/infrastructure/database/prisma/schema.prisma`
   - Migration: `yarn prisma:migrate -- --name [name]`

6. **Task 3.2:** [Repository implementation]
   - Files: `src/infrastructure/repositories/...`
   - Tests: `src/tests/infrastructure/...`

**Checkpoint:** `yarn test src/tests/infrastructure/` passes

### Phase 4: Presentation Layer
**Goal:** Expose via API and UI

7. **Task 4.1:** [API route]
   - Files: `src/app/api/...`

8. **Task 4.2:** [Hook]
   - Files: `src/hooks/...`

9. **Task 4.3:** [Component updates]
   - Files: `src/components/...`

**Final Checkpoint:** `yarn test && yarn build` passes

## Risks & Mitigations
- Risk 1: [description] → Mitigation: [approach]

## Open Questions
- [ ] Question needing clarification
```

## Execution Workflow

When executing a plan:

1. **Start session**: Create `docs/progress/sessions/YYYY-MM-DD-slug.md`
2. **For each task**:
   - Read relevant existing code
   - Implement changes
   - Write tests immediately
   - Run tests: `yarn test [path]`
   - Only proceed if tests pass
3. **At checkpoints**: Run full layer test suite
4. **On completion**: Update session file with outcomes

## Architecture Reminders

### Layer Dependencies
```
Presentation → Application → Domain ← Infrastructure
                    ↓
              (DTOs only cross to Presentation)
```

### Key Patterns
- **Domain**: Pure logic, no framework code, emit events
- **Application**: Orchestrate via use cases, return DTOs
- **Infrastructure**: Implement repository interfaces with Prisma
- **Presentation**: Consume DTOs only, never entities

### Import Rules
```typescript
// ✅ Correct
import { Quiz } from '@domain/entities/quiz';
import { QuizDTO } from '@application/dtos/quiz.dto';
import { PrismaClient } from '@infrastructure/database/prisma/generated-client';

// ❌ Wrong
import { PrismaClient } from '@prisma/client';
import { Quiz } from '../../domain/entities/quiz';
```

## Tools Available
- All file operations (read, edit, write)
- Bash for yarn commands, git operations
- Prisma CLI for migrations
- Supabase MCP for database inspection
- Playwright MCP for E2E testing
