````markdown
# Step 3: Infrastructure & Persistence

Wire Prisma + Supabase so repositories can talk to a real database while staying faithful to the DTO → Entity → Service flow.

## Objectives
- Model the quiz domain in Prisma (Supabase Postgres) and keep migrations in version control.
- Implement repository **implementations** under `src/infrastructure/repositories/**` that fulfill the domain interfaces.
- Centralize shared infrastructure concerns (Prisma client lifecycle, Supabase admin SDK, feature flags, logging).
- Expose backing API routes (`src/app/api/**`) that call application services using validated DTOs.
- Add contract/integration tests that hit the Prisma test database.

## Tasks
1. **Prisma schema**
   - Define models for quizzes, questions, answers, players, media assets, and sessions.
   - Capture value-object data (e.g., timers, scores) via embedded JSON fields where practical.
   - Use snake_case table names that mirror Supabase defaults; add indexes for `sessionCode`, `playerId`, etc.
2. **Migrations & tooling**
   - Place `schema.prisma` + generated migrations in `src/infrastructure/database/prisma/`.
   - Add scripts:
     - `yarn prisma:generate` → `prisma generate`
     - `yarn prisma:migrate` → `prisma migrate dev --name <desc>`
     - Document Supabase shadow DB requirements in `docs/01-setup-project.md` if anything new arises.
3. **Prisma client wrapper**
   - `src/infrastructure/database/client.ts` exports a singleton Prisma client with:
     - graceful shutdown hooks for Next.js (avoid hot-reload leaks),
     - logging aligned with `lib/logger`.
4. **Repository implementations**
   - Implement `QuizRepositoryPrisma`, `PlayerRepositoryPrisma`, `QuestionRepositoryPrisma`, etc. inside `src/infrastructure/repositories/`.
   - Keep mapping helpers (`prismaQuizToEntity`) close to the repositories.
   - Reuse DTO mappers so responses stay consistent.
5. **Supabase integration**
   - Configure Supabase client for storage/auth tasks (if needed) under `src/infrastructure/supabase/`.
   - Ensure `.env.example` lists all required keys and `README`/docs mention onboarding steps.
6. **API routes**
   - Add skeleton routes under `src/app/api/**` that validate request DTOs, call application services, and return JSON.
   - Use `NextResponse.json` with proper status codes (400 for validation errors, 404 for missing quiz, etc.).
7. **Integration tests**
   - Extend `src/tests/integration/**` to run against a disposable Prisma DB (Supabase test schema or local Postgres).
   - Use `vitest` + `dotenv` to load a `DATABASE_URL_TEST`. Provide docs on seeding/tearing down.

## Acceptance Criteria
- Running `yarn prisma:migrate` applies all migrations locally; `yarn prisma:generate` keeps the client up to date.
- Repository implementations return the same DTO-friendly data that in-memory doubles provided.
- API routes exist for start quiz, submit answer, add player, etc., even if they return stub data initially.
- Integration tests covering at least one repository + service path pass via `yarn test`.
- All new env vars documented in `.env.example` and referenced in `docs/01-setup-project.md` if onboarding changes.

## Prisma workflow reference
- All Prisma assets live under `src/infrastructure/database/prisma/`. Generated migrations are tracked in the sibling `migrations/` folder so Supabase stays reproducible.
- Run `yarn prisma:generate` whenever the schema changes so the client under `node_modules/.prisma` stays in sync.
- Run `yarn prisma:migrate -- --name <change>` to create and apply migrations (the extra `--` passes arguments through to Prisma).
- Use `yarn prisma:seed` to execute `src/infrastructure/database/prisma/seed.ts`, which clears the database via `resetDatabase()` and re-creates a demo quiz using helpers from `seed-helpers.ts`.
- Tests or scripts that need fixture data can import `resetDatabase`/`seedSampleQuiz` from `seed-helpers.ts` instead of duplicating the seeding logic.

## Next Steps
Proceed to Step 4 to focus on presentation hooks, TanStack Query wiring, and realtime transport.
````