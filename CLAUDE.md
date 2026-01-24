# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A real-time quiz game built with Next.js 15, Prisma v7, and Supabase. Uses DDD-lite architecture with strict layer separation: Domain → Application → Infrastructure → Presentation.

## Commands

```bash
yarn dev                    # Dev server with Turbopack
yarn build                  # Production build (auto-runs prisma:generate)
yarn lint                   # ESLint + Prettier
yarn test                   # Run all Vitest tests
yarn test src/tests/domain/entities/quiz.test.ts  # Run single test file
yarn test:watch             # Watch mode
yarn prisma:generate        # Regenerate Prisma client (required after schema changes)
yarn prisma:migrate         # Create/apply migrations
yarn test:e2e               # Playwright E2E tests
```

## Architecture

### Data Flow
```
Next.js API route → zod DTO validation → use-case/service → domain entity → Prisma repository → Supabase Postgres
```

### Layer Rules
- **Domain** (`src/domain/**`): Pure business logic, framework-agnostic. Entities, value objects, aggregates, repository interfaces.
- **Application** (`src/application/**`): Use cases orchestrate domain, return DTOs. Services group related use cases.
- **Infrastructure** (`src/infrastructure/**`): Prisma repositories implement domain interfaces. Realtime adapters, auth, storage.
- **Presentation** (`src/app/**`, `src/components/**`, `src/hooks/**`): Consumes only DTOs. Never import entities or Prisma types.

### Path Aliases
```
@domain/*        → src/domain/*
@application/*   → src/application/*
@infrastructure/* → src/infrastructure/*
@components/*    → src/components/*
@hooks/*         → src/hooks/*
@lib/*           → src/lib/*
@ui/*            → src/components/ui/*
```

## Prisma v7 Setup (Non-Standard)

Uses driver adapter pattern, NOT default Prisma:

1. **Schema location**: `src/infrastructure/database/prisma/schema.prisma`
2. **Generated client**: `./generated/client` (git-ignored)
3. **Client instantiation** requires adapter:
   ```typescript
   import { PrismaPg } from '@prisma/adapter-pg';
   import { PrismaClient } from './generated-client';
   const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
   const prisma = new PrismaClient({ adapter });
   ```
4. **Import path**: Use `@infrastructure/database/prisma/generated-client`, NOT `@prisma/client`

Always run `yarn prisma:generate` after schema changes.

## Testing Requirements (Mandatory)

**Tests are NOT optional.** Write tests WHILE implementing, not after.

```bash
yarn test                    # Run all tests
yarn test [file-or-pattern]  # Run specific tests
yarn test:watch              # TDD watch mode
```

**Every feature requires:**
- Domain tests: `src/tests/domain/` - entity behavior, invariants
- Use case tests: `src/tests/application/use-cases/` - success + error paths
- Repository tests: `src/tests/infrastructure/repositories/` - CRUD + edge cases

**Before moving to the next task:** `yarn test` must pass.

## MCP Servers

Configured in `.mcp.json` (project root):

| Server | Purpose |
|--------|---------|
| **Supabase** | Database queries, migrations, logs, Edge Functions, storage |
| **Playwright** | Browser automation for E2E testing - navigate, click, screenshot |
| **Context7** | Documentation and context retrieval |

### Common MCP Workflows
```bash
# After schema changes - check for RLS issues
mcp__supabase__get_advisors(type: 'security')

# Debug runtime issues
mcp__supabase__get_logs(service: 'postgres')

# E2E testing - explore UI before writing tests
mcp__playwright__navigate(url: 'http://localhost:3000')
mcp__playwright__snapshot()
```

## Custom Skills

### Workflow Skills
- `/add-feature` - Step-by-step DDD feature implementation with test gates
- `/test` - Testing workflow, patterns, and minimum coverage
- `/session-start` - Initialize development session with progress tracking
- `/prisma-migrate` - Safe database migration workflow

### Agent-Like Skills
- `/product-owner` - Business perspective, requirements clarification, documentation
- `/fullstack-planner` - Create detailed implementation plans, execute with tests

## Key Patterns

### API Routes
1. Validate input with zod schema
2. Call `getServices()` from `src/application/services/factories.ts`
3. Invoke use case or service method
4. Return JSON DTOs
5. Map `/not found/i` errors to 404

### Adding Features (with tests at each step)
1. Domain: Define entity behavior → **write domain tests**
2. Application: Create use case → **write use case tests**
3. Infrastructure: Update Prisma/repository → **write repository tests**
4. Presentation: API route + hook + component
5. Verify: `yarn test` passes before committing

### Testing Patterns
- **Domain**: Pure unit tests, no mocks needed for entities
- **Use cases**: Mock repositories, test success + NOT_FOUND + validation errors
- **Repositories**: Use `resetServices({ force: true })` between tests
- **E2E**: Playwright with manual-first discovery

## Common Pitfalls

1. **Next.js 15 params**: Must `await params` in route handlers before accessing values
2. **Wrong Prisma import**: Use `@infrastructure/database/prisma/generated-client`
3. **Leaking entities to UI**: Components must receive DTOs only
4. **Skipping prisma:generate**: Required after any schema.prisma changes
5. **Test isolation**: Call `resetServices({ force: true })` for fresh Prisma client in tests
