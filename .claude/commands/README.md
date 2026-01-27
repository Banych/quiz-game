# Claude Commands

Six custom slash commands guide complex workflows for development and planning. Invoke via `/command-name` in Claude.ai when working with this repository.

## Available Commands

### `add-feature` — DDD Feature Implementation with Test Gates
Implements new quiz game features end-to-end following DDD layers with mandatory test coverage at each step.

**Use when:** Adding new functionality (e.g., player rankings, question categories, bonus scoring)

**Workflow:** Define requirements → Create domain entities/tests → Build application use cases/tests → Wire infrastructure → Expose API/UI → Document decisions

**Output:** Feature code fully integrated across domain/application/infrastructure/presentation layers, with test files for each layer

---

### `fullstack-planner` — Detailed Implementation Planning
Creates a comprehensive, actionable implementation plan with step-by-step breakdown before starting code.

**Use when:** Tackling complex features or refactoring that spans multiple files or architectural layers

**Workflow:** Understand requirements → Analyze codebase impact → Draft step-by-step plan → Present for review → Implement based on approved plan

**Output:** Detailed plan document with steps, file changes, and implementation order; code changes only after approval

---

### `prisma-migrate` — Safe Database Migration Workflow
Guides schema changes, generates migrations, and validates RLS policies and indexes.

**Use when:** Modifying database schema (adding tables, columns, or changing field types)

**Workflow:** Plan schema change → Generate migration → Apply to dev DB → Check for RLS gaps via Supabase advisor → Regenerate Prisma client → Update mappers/DTOs

**Output:** Git-tracked migration files, validated schema, updated Prisma client, and DTO changes synchronized

---

### `product-owner` — Business Requirements Clarification
Adopts business perspective to refine feature requests, clarify acceptance criteria, and define success metrics.

**Use when:** Discussing new features, user stories, or scope decisions with product/business context

**Workflow:** Gather requirements → Ask clarifying questions → Define acceptance criteria → Suggest technical approach aligned with business goals

**Output:** Clear, testable requirements with acceptance criteria and business impact assessment

---

### `session-start` — Development Session Initialization
Sets up a tracked development session with progress logging, goal definition, and artifact organization.

**Use when:** Starting a new work session to track progress, block goals, and document decisions

**Workflow:** Define session goals → Create progress tracking doc → Start work → Update doc with completions → Close session with summary

**Output:** Session log in `docs/progress/sessions/<DATE>-slug.md` with goals, blocked items, and lessons learned

---

### `test` — Testing Workflow & Minimum Coverage
Guides test writing strategy, patterns for domain/application/infrastructure, and validates minimum coverage.

**Use when:** Writing or debugging tests, defining test strategy for new features, or improving test coverage

**Workflow:** Understand feature requirements → Map test scenarios (happy path + edge cases) → Write tests → Run suite → Verify coverage meets minimum

**Output:** Test files with proper assertions, documented patterns, and coverage reports

---

## Quick Reference

| Command             | Purpose                           | Ideal Input                               | Ideal Output                                |
| ------------------- | --------------------------------- | ----------------------------------------- | ------------------------------------------- |
| `add-feature`       | End-to-end feature implementation | Feature description + acceptance criteria | Complete feature code + tests + docs        |
| `fullstack-planner` | Plan before implementation        | Complex task description                  | Detailed step-by-step plan for review       |
| `prisma-migrate`    | Database schema changes           | Schema change request                     | Migration files + validated Prisma client   |
| `product-owner`     | Clarify business requirements     | Feature idea or user story                | Clear acceptance criteria + success metrics |
| `session-start`     | Track development session         | Session goals/tasks                       | Progress tracking doc + session summary     |
| `test`              | Test strategy & implementation    | Feature/bug to test                       | Test files + coverage report + patterns     |

## Implementation Notes

### Command Invocation
- Type `/command-name` in any Claude.ai chat message
- Commands provide structure and guidance; you still drive the implementation
- Some commands may prompt for clarification—answer to refine context

### Combining Commands
- Use `session-start` to begin, `product-owner` to clarify, `fullstack-planner` to plan, then `add-feature` to code
- Use `prisma-migrate` when features require database schema changes
- Use `test` alongside `add-feature` (not after)—testing is integrated into development

### Documentation & Artifacts
- Session commands create progress docs in `docs/progress/sessions/<DATE>-slug.md`
- Implementation decisions are logged in `docs/progress/dev-notes.md`
- Architecture changes update `docs/ARCHITECTURE.md` or related docs

## See Also
- `.github/copilot-instructions.md` — Main Copilot guidance (architecture, Prisma, testing, MCP toolbox)
- `.github/instructions/iterative-approach-for-work-with-code.instructions.md` — Mandatory iterative development methodology
- `CLAUDE.md` — Condensed Claude Code shorthand for quick reference
