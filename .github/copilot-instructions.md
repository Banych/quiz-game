# Quiz Game – Copilot Instructions

## Architecture Overview
This is a **Next.js 15 + Prisma v7 + Supabase** quiz game using **DDD-lite** (Domain-Driven Design) patterns. The critical data flow is:
```
Next.js request → DTO (zod) → use-case/service → domain entities → Prisma repository → Supabase Postgres
```

**Key architectural rules:**
- Domain logic lives in `src/domain/**` (entities, aggregates, value objects) and stays framework-agnostic
- Application layer (`src/application/**`) orchestrates via use cases/services, returns DTOs
- Infrastructure (`src/infrastructure/**`) implements repositories with Prisma
- Presentation (`src/app/**`, `src/components/**`, `src/hooks/**`) consumes only DTOs—never entities or Prisma types

## Critical Prisma v7 Setup
**Prisma uses driver adapters** (not default engine). This is NOT the standard Prisma config:

1. **Generator output:** Schema at `src/infrastructure/database/prisma/schema.prisma` uses:
   ```prisma
   generator client {
     provider = "prisma-client"
     output   = "./generated/client"
   }
   ```

2. **Client instantiation:** `src/infrastructure/database/prisma/client.ts` instantiates with `@prisma/adapter-pg`:
   ```ts
   import { PrismaPg } from '@prisma/adapter-pg';
   import { PrismaClient } from './generated-client';

   const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
   const prisma = new PrismaClient({ adapter });
   ```

3. **Import path:** All code imports Prisma types via `@infrastructure/database/prisma/generated-client` barrel (NOT `@prisma/client`)

4. **Build workflow:** `package.json` has `"prebuild": "yarn prisma:generate"` so Vercel/CI regenerate the client before `next build` (generated files are git-ignored)

**Common mistakes to avoid:**
- ❌ Importing from `@prisma/client` directly
- ❌ Forgetting to run `yarn prisma:generate` after schema changes
- ❌ Trying to instantiate PrismaClient without the adapter

## Iterative Development Approach
This codebase enforces an **iterative, incremental development style** via `.github/instructions/iterative-approach-for-work-with-code.instructions.md` (applies to all files):

**Core principles:**
- Break complex tasks into small, testable increments (single function/class/module)
- Test each piece immediately before moving to the next
- Refactor after each working increment—don't accumulate technical debt
- Document as you go (inline comments + session logs in `docs/progress/`)
- Plan work upfront: outline sub-tasks before coding

**Why this matters:** This project uses DDD layers with strict boundaries (domain → application → infrastructure → presentation). Attempting to implement features "all at once" across layers leads to mismatched contracts between DTOs/entities/repos. Instead:
1. Start with domain entities and test behavior
2. Build application use cases that orchestrate them
3. Wire infrastructure (Prisma repos) and verify with integration tests
4. Finally expose via API routes and hooks

**When adding features:** See the pattern in `docs/progress/sessions/*.md`—each session breaks goals into concrete steps, marks progress incrementally, and documents decisions. Follow this when implementing new quiz flows, player actions, or realtime features.

## MCP-Assisted Testing (Playwright MCP)
When writing or debugging E2E tests, use **Playwright MCP** (`@playwright/mcp` server) for interactive testing:

1. **Activate tools:** Call `activate_browser_navigation_tools()` and `activate_page_capture_tools()`
2. **Navigate:** `mcp_microsoft_pla_browser_navigate(url)` to load pages
3. **Interact:** Use `mcp_microsoft_pla_browser_type()`, `mcp_microsoft_pla_browser_click()` to test flows
4. **Inspect:** `mcp_microsoft_pla_browser_snapshot()` to see page state and locators
5. **Verify:** Observe actual behavior before writing test assertions

**Why this matters:** Writing E2E tests without manual verification often leads to:
- Overcomplicated wait conditions and timeouts
- Wrong locator strategies (e.g., strict mode violations from ambiguous selectors)
- Tests that don't match real user flows

**Best practice:** Test the actual flow interactively via MCP first, then write simplified tests based on what you observed working. Example: Discovered `getByText(/Active/i)` matched 9 elements (player statuses), fixed by scoping to `getByRole('banner').getByText(/Active/i)`.

**Viewing test results:** After running E2E tests with `yarn test:e2e`, Playwright automatically serves an HTML report (usually on port 9323). Instead of parsing terminal output, navigate directly to the report using `mcp_microsoft_pla_browser_navigate('http://localhost:9323')` to inspect test results, click on failed tests, view screenshots, and see detailed error messages.

## Essential Workflows

### MCP-Assisted Testing (Playwright MCP)
When writing or debugging E2E tests, use **Playwright MCP** (`@playwright/mcp` server) for interactive testing:

1. **Activate tools:** Call `activate_browser_navigation_tools()` and `activate_page_capture_tools()`
2. **Navigate:** `mcp_microsoft_pla_browser_navigate(url)` to load pages
3. **Interact:** Use `mcp_microsoft_pla_browser_type()`, `mcp_microsoft_pla_browser_click()` to test flows
4. **Inspect:** `mcp_microsoft_pla_browser_snapshot()` to see page state and locators
5. **Verify:** Observe actual behavior before writing test assertions

**Why this matters:** Writing E2E tests without manual verification often leads to:
- Overcomplicated wait conditions and timeouts
- Wrong locator strategies (e.g., strict mode violations from ambiguous selectors)
- Tests that don't match real user flows

**Best practice:** Test the actual flow interactively via MCP first, then write simplified tests based on what you observed working. Example: Discovered `getByText(/Active/i)` matched 9 elements (player statuses), fixed by scoping to `getByRole('banner').getByText(/Active/i)`.

### Development Commands (Yarn ONLY—never use npm/npx)
```bash
yarn dev                    # Next.js dev server with Turbopack
yarn build                  # Production build (auto-runs prisma:generate)
yarn lint                   # ESLint with Prettier
yarn test                   # Run Vitest suite
yarn test:watch             # Vitest watch mode
yarn prisma:migrate         # Create/apply Prisma migration
yarn prisma:generate        # Regenerate Prisma client after schema edits
yarn prisma:seed            # Reset DB and seed demo data via seed-helpers.ts
yarn shadcn add <component> # Add shadcn UI primitive
```

### Path Aliases (tsconfig.json + vitest.config.ts)
All imports use absolute paths via these aliases:
- `@domain/*` → `src/domain/*`
- `@application/*` → `src/application/*`
- `@infrastructure/*` → `src/infrastructure/*`
- `@components/*` → `src/components/*`
- `@hooks/*` → `src/hooks/*`
- `@lib/*` → `src/lib/*`
- `@ui/*` → `src/components/ui/*`

**Update both configs if moving folders** or builds/tests break.

### API Route Pattern
See `src/app/api/player/add/route.ts` or `src/app/api/quiz/[quizId]/state/route.ts`:
1. Validate params/body with zod schemas
2. Call `getServices()` from `src/application/services/factories.ts` (singleton that wires Prisma repos)
3. Invoke use case or service method
4. Return JSON DTOs
5. Map domain errors to HTTP codes (404 when error matches `/not found/i`)

### Repository Implementation Pattern
Domain interfaces in `src/domain/repositories/**` define contracts. Prisma implementations in `src/infrastructure/repositories/**` must:
- Rebuild aggregates from normalized DB rows (e.g., `PrismaQuizRepository` sorts questions by `orderIndex`, hydrates answers)
- Map domain value objects (seconds) ↔ Postgres columns (milliseconds for timers)
- Update both repository mapper AND DTO mapper (`src/application/mappers/**`) when schema changes

### Testing Strategy
- **Domain/Application:** In-memory doubles or mocked repos, Vitest under `src/tests/**`
- **Infrastructure:** Use test DB (`DATABASE_URL_TEST`), reset Prisma via `resetServices({ force: true })` between suites
- **Pattern:** See `src/tests/domain/entities/quiz.test.ts` for entity tests, `src/tests/infrastructure/repositories/prisma-quiz-repository.test.ts` for repo contracts

## DTO-First Development
**DTOs are the single source of truth** for API contracts:
1. Define/update zod schema in `src/application/dtos/**/*.ts`
2. Update mappers in `src/application/mappers/**` (domain entity ↔ DTO)
3. Update every API route and hook that consumes that DTO
4. **Never** let React components import entities or Prisma types—only DTOs

Example: Adding a field like `playerRank` requires touching:
- `src/application/dtos/player.dto.ts` (zod schema)
- `src/application/mappers/player-mapper.ts` (entity → DTO)
- Any API route returning `PlayerDTO`
- Any hook/component consuming player data

## Documentation Requirements
**Docs are part of the codebase, not optional:**
- `docs/plan.md` – roadmap and release goals
- `docs/structure.md` – DDD layer architecture
- `docs/01-setup-project.md` → `docs/04-presentation-and-realtime.md` – numbered step guides
- `docs/progress/sessions/<DATE>-slug.md` – track each work session (active goals + completed items)
- `docs/progress/dev-notes.md` – append short execution notes after changes
- `docs/progress/actions/*.md` – action items per release

**Update relevant docs immediately when:**
- Architecture patterns change
- New workflows are introduced
- Environment variables are added
- DTO contracts evolve

**Stale docs are treated as regressions** since future agents rely on them.

## Styling & UI Components
- **Tailwind 4** configured in `src/app/globals.css` with OKLCH tokens and `@custom-variant dark`
- Use `cn()` helper from `src/lib/utils.ts` for conditional classes
- Reuse primitives from `src/components/ui` (managed via `components.json`)
- Add new primitives via `yarn shadcn add <component>` (auto-tracked in registry)
- **Avoid inline styles**—use design tokens

## Realtime & State Management
- **TanStack Query** handles server state (queries/mutations)
- `src/hooks/**` wraps TanStack Query + domain service calls
- `src/infrastructure/realtime/` contains WebSocket adapter contract (`RealtimeClient`, currently using `createNoopRealtimeClient` stub)
- Components access via `RealtimeClientProvider`/`useRealtimeClient` so event handlers can `setQueryData` for optimistic updates
- **Never** subscribe to raw WebSocket events in components—always via hooks

## Environment & Deployment
- `.env.example` documents all required vars (`DATABASE_URL`, Supabase keys, etc.)
- Vercel serves Next.js + API routes
- Supabase provides Postgres (via Prisma) + Storage
- `prebuild` script ensures Prisma client regenerates on every deploy
- MCP toolbox configured in `.vscode/mcp.json` (Supabase HTTP, Playwright, Postman servers)—all run via `nvm use` to ensure Node 22

## Common Pitfalls
1. **Forgetting to await Next.js 15 params:** Route handlers must `await params` before accessing `params.quizId`
2. **Skipping Prisma generation:** Always run `yarn prisma:generate` after schema edits or imports break
3. **Importing wrong Prisma path:** Use `@infrastructure/database/prisma/generated-client`, NOT `@prisma/client`
4. **Leaking entities to UI:** Components must receive DTOs, never domain entities
5. **Ignoring path aliases:** Use `@application/*` etc., not relative paths like `../../application`
6. **Missing service factory reset in tests:** Call `resetServices({ force: true })` when tests need fresh Prisma client