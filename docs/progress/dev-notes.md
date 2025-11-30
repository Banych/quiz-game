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
- Prisma schema draft (2025-11-30): `src/infrastructure/database/prisma/schema.prisma` defines enums for quiz/player/question states plus `Quiz`, `Question`, `Player`, and `Answer` models aligned with the DTO catalog. Relationships include quiz-scoped players/answers, ordered questions with publication flags, and scoreboard-friendly score/rank fields on players.
- Action notes now live under `docs/progress/actions/**` to mirror each Release R1 checklist item without bloating this log.
- Use case/service fill (2025-11-30): Added player + quiz mappers and DTO-focused use cases (`get-quiz-state`, `get-player-session`, `list-quiz-players`, `advance-question`) plus service facades (`QuizService`, `PlayerService`). `IPlayerRepository` now exposes `findByQuizId` so Prisma can hydrate lobby views. Tests run: `yarn test get-player-session-use-case`, `yarn test list-quiz-players-use-case`.
- Current status: DTO mappers + quiz state/advance use cases are in place; next step is wiring Prisma-backed repositories so these workflows hit Supabase data.
- Prisma wiring (2025-11-30): Created `prisma.config.ts` pointing at `src/infrastructure/database/prisma/schema.prisma`, regenerated the Prisma client, and implemented `PrismaPlayerRepository` with DTO-friendly mapping plus safe deletes. Added `src/tests/infrastructure/repositories/prisma-player-repository.test.ts` to cover find/list/save/delete paths using hoisted mocks (`vi.hoisted`) so Vitest can run without top-level await.
````