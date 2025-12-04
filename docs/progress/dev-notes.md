````markdown
# Dev Progress Log

## 2025-11-30
- MCP servers trimmed to Supabase HTTP endpoint + Playwright MCP; Playwright runs via `nvm use` so telemetry works.
- Ready to start Release R1 (Domain & Data) tasks:
  1. Define DTO catalog under `src/application/dtos/**` and align hooks/services to those types.
  2. Audit domain repository interfaces (`src/domain/repositories/**`) to ensure they cover upcoming host/player flows.
  3. Draft Prisma schema + migrations inside `src/infrastructure/database/prisma/` that map cleanly to entities/DTOs.
  4. Fill any missing use cases/services so application layer exposes the workflows host/player UIs will need.
- Repository audit (2025-11-30):
  - `IQuizRepository` (`src/domain/repositories/quiz-repository.ts`) only supports `findById/save/delete` on `QuizSessionAggregate`. Host/player flows need lookup by share code, filtering by status (pending/active), and partial persistence hooks (e.g., updating leaderboard or current question) so Prisma can avoid rewriting the entire aggregate.
  - `IPlayerRepository` (`src/domain/repositories/player-repository.ts`) lacks quiz scoping. We need `listByQuizId`, `findByQuizIdAndName`, and status/score update helpers to hydrate `PlayerDTO` (which includes `status`, `score`, `rank`). Players currently have no persisted link back to a quiz session.
  - `IQuestionRepository` (`src/domain/repositories/question-repository.ts`) is unused and only exposes CRUD by id. R1 requires batch fetch by quiz, publishing toggles, and ordering helpers to map into the `QuizDTO.questions` array.
- Prisma parity (2025-11-30): `PrismaQuizRepository` now handles join-code lookups and partial updates while normalizing timer metrics (seconds in domain ↔ milliseconds in Postgres); companion tests live in `src/tests/infrastructure/repositories/prisma-quiz-repository.test.ts`.
- Prisma schema draft (2025-11-30): `src/infrastructure/database/prisma/schema.prisma` defines enums for quiz/player/question states plus `Quiz`, `Question`, `Player`, and `Answer` models aligned with the DTO catalog. Relationships include quiz-scoped players/answers, ordered questions with publication flags, and scoreboard-friendly score/rank fields on players.
- Action notes now live under `docs/progress/actions/**` to mirror each Release R1 checklist item without bloating this log.
- Use case/service fill (2025-11-30): Added player + quiz mappers and DTO-focused use cases (`get-quiz-state`, `get-player-session`, `list-quiz-players`, `advance-question`) plus service facades (`QuizService`, `PlayerService`). `IPlayerRepository` now exposes `findByQuizId` so Prisma can hydrate lobby views. Tests run: `yarn test get-player-session-use-case`, `yarn test list-quiz-players-use-case`.
- Current status: DTO mappers + quiz state/advance use cases are in place; next step is wiring Prisma-backed repositories so these workflows hit Supabase data.
- Prisma wiring (2025-11-30): Created `prisma.config.ts` pointing at `src/infrastructure/database/prisma/schema.prisma`, regenerated the Prisma client, and implemented `PrismaPlayerRepository` with DTO-friendly mapping plus safe deletes. Added `src/tests/infrastructure/repositories/prisma-player-repository.test.ts` to cover find/list/save/delete paths using hoisted mocks (`vi.hoisted`) so Vitest can run without top-level await.
- Application/API progress (2025-11-30 later session):
  - Extended `Quiz` + `QuizSessionAggregate` to persist/share `joinCode`, plus added a new `JoinSessionUseCase` with Vitest coverage for joining by code while hydrating players.
  - Introduced `src/application/services/factories.ts` so API routes can lazy-load Prisma repositories + service facades without duplicating wiring.
  - Stubbed the first Next.js API routes: `POST /api/session/join`, `POST /api/player/add`, `POST /api/quiz/start`, and `POST /api/player/answer`—each validates zod payloads, invokes the relevant service/use case, and maps domain errors to HTTP codes.
  - Added seed helpers + shared Prisma workflow docs earlier in the day; latest endpoints now reuse `PlayerService`, `QuizService`, and `AnswerService` directly via the factory to stay aligned with DTO contracts.
- Host data APIs (2025-11-30 evening): Added `GET /api/quiz/[quizId]/state` and `GET /api/quiz/[quizId]/players` so the upcoming host dashboard can hydrate quiz state + lobby rosters via `QuizService`/`PlayerService`; route handlers ship with Vitest coverage that mocks Prisma at the factory layer.
- 2025-12-04: Installed TanStack Query (+ devtools), introduced `AppProviders` to wrap the Next.js layout, and shipped the first host dashboard route (`/quiz/[quizId]`) that hydrates `QuizDTO` via `getServices` then hands control to the client-side `useHostQuizState` hook for periodic refetches.
# Dev Progress Log

## 2025-11-30
- MCP servers trimmed to Supabase HTTP endpoint + Playwright MCP; Playwright runs via `nvm use` so telemetry works.
- Ready to start Release R1 (Domain & Data) tasks:
  1. Define DTO catalog under `src/application/dtos/**` and align hooks/services to those types.
  2. Audit domain repository interfaces (`src/domain/repositories/**`) to ensure they cover upcoming host/player flows.
  3. Draft Prisma schema + migrations inside `src/infrastructure/database/prisma/` that map cleanly to entities/DTOs.
  4. Fill any missing use cases/services so application layer exposes the workflows host/player UIs will need.
- Repository audit (2025-11-30):
  - `IQuizRepository` (`src/domain/repositories/quiz-repository.ts`) only supports `findById/save/delete` on `QuizSessionAggregate`. Host/player flows need lookup by share code, filtering by status (pending/active), and partial persistence hooks (e.g., updating leaderboard or current question) so Prisma can avoid rewriting the entire aggregate.
  - `IPlayerRepository` (`src/domain/repositories/player-repository.ts`) lacks quiz scoping. We need `listByQuizId`, `findByQuizIdAndName`, and status/score update helpers to hydrate `PlayerDTO` (which includes `status`, `score`, `rank`). Players currently have no persisted link back to a quiz session.
  - `IQuestionRepository` (`src/domain/repositories/question-repository.ts`) is unused and only exposes CRUD by id. R1 requires batch fetch by quiz, publishing toggles, and ordering helpers to map into the `QuizDTO.questions` array.
- Prisma parity (2025-11-30): `PrismaQuizRepository` now handles join-code lookups and partial updates while normalizing timer metrics (seconds in domain ↔ milliseconds in Postgres); companion tests live in `src/tests/infrastructure/repositories/prisma-quiz-repository.test.ts`.
- Prisma schema draft (2025-11-30): `src/infrastructure/database/prisma/schema.prisma` defines enums for quiz/player/question states plus `Quiz`, `Question`, `Player`, and `Answer` models aligned with the DTO catalog. Relationships include quiz-scoped players/answers, ordered questions with publication flags, and scoreboard-friendly score/rank fields on players.
- Action notes now live under `docs/progress/actions/**` to mirror each Release R1 checklist item without bloating this log.
- Use case/service fill (2025-11-30): Added player + quiz mappers and DTO-focused use cases (`get-quiz-state`, `get-player-session`, `list-quiz-players`, `advance-question`) plus service facades (`QuizService`, `PlayerService`). `IPlayerRepository` now exposes `findByQuizId` so Prisma can hydrate lobby views. Tests run: `yarn test get-player-session-use-case`, `yarn test list-quiz-players-use-case`.
- Current status: DTO mappers + quiz state/advance use cases are in place; next step is wiring Prisma-backed repositories so these workflows hit Supabase data.
- Prisma wiring (2025-11-30): Created `prisma.config.ts` pointing at `src/infrastructure/database/prisma/schema.prisma`, regenerated the Prisma client, and implemented `PrismaPlayerRepository` with DTO-friendly mapping plus safe deletes. Added `src/tests/infrastructure/repositories/prisma-player-repository.test.ts` to cover find/list/save/delete paths using hoisted mocks (`vi.hoisted`) so Vitest can run without top-level await.
- Application/API progress (2025-11-30 later session):
  - Extended `Quiz` + `QuizSessionAggregate` to persist/share `joinCode`, plus added a new `JoinSessionUseCase` with Vitest coverage for joining by code while hydrating players.
  - Introduced `src/application/services/factories.ts` so API routes can lazy-load Prisma repositories + service facades without duplicating wiring.
  - Stubbed the first Next.js API routes: `POST /api/session/join`, `POST /api/player/add`, `POST /api/quiz/start`, and `POST /api/player/answer`—each validates zod payloads, invokes the relevant service/use case, and maps domain errors to HTTP codes.
  - Added seed helpers + shared Prisma workflow docs earlier in the day; latest endpoints now reuse `PlayerService`, `QuizService`, and `AnswerService` directly via the factory to stay aligned with DTO contracts.
- Integration coverage (2025-11-30 evening): Added `src/tests/integration/add-player.integration.test.ts` to exercise `AddPlayerUseCase` end-to-end against the Prisma repositories plus seed helpers; the suite lazily loads Prisma modules and skips itself when `DATABASE_URL` is not pointed at a disposable test database.
- 2025-12-04: Stubbed the realtime layer with `src/infrastructure/realtime/realtime-client.ts`, a `createNoopRealtimeClient` default, and `RealtimeClientProvider`/`useRealtimeClient`. `AppProviders` now instantiates the client once per render tree and `useHostQuizState` subscribes to `quiz:${quizId}` `state:update` events so TanStack Query caches can react as soon as transports go live.
- 2025-12-04: Stubbed the realtime layer with `src/infrastructure/realtime/realtime-client.ts`, a `createNoopRealtimeClient` default, and `RealtimeClientProvider`/`useRealtimeClient`. `AppProviders` now instantiates the client once per render tree and `useHostQuizState` subscribes to `quiz:${quizId}` `state:update` events so TanStack Query caches can react as soon as transports go live.
- 2025-12-04: Fixed Vercel build failure by updating `/api/quiz/[quizId]/state` and `/api/quiz/[quizId]/players` route handlers to destructure `params` directly (typed via their Zod schemas) so Next.js accepts the GET signatures during lint/type checks.