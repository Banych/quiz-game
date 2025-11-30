# File Ideas Ledger

Track future improvements or follow-ups per file so context survives between sessions. Use the checklist below and append entries rather than overwriting existing notes.

| File                                                        | Idea / Follow-up                                                                                           | Status |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------ |
| _example: src/application/use-cases/start-quiz.use-case.ts_ | Support retries + telemetry events once realtime gateway exists.                                           | TODO   |
| src/domain/repositories/quiz-repository.ts                  | Add lookup by share code/status plus partial update helpers for leaderboard.                               | Done   |
| src/domain/repositories/question-repository.ts              | Expand interface for batch fetch by quiz/order + publish toggles.                                          | Done   |
| src/infrastructure/repositories/prisma-*.repository.ts      | Implement Quiz/Question/Answer Prisma repos + shared mappers/tests.                                        | Done   |
| src/infrastructure/database/prisma/schema.prisma            | Add migrations, snake_case table mapping, and seed helpers.                                                | TODO   |
| package.json                                                | Add `prisma:generate` / `prisma:migrate` scripts and reference in docs.                                    | Done   |
| docs/01-setup-project.md                                    | Document DATABASE_URL/Supabase shadow DB setup + Prisma workflow.                                          | Done   |
| src/app/api/**                                              | Create REST endpoints (join, start, submit answer) calling application layer.                              | Done   |
| src/tests/integration/**                                    | Add Prisma-backed repository/service integration tests with disposable DB.                                 | TODO   |
| src/tests/integration/add-player.integration.test.ts        | Schedule a manual run against a disposable DB (set `DATABASE_URL_TEST` + opt-in flag, seed/reset, verify). | TODO   |

_Add new rows as you uncover ideas. Mark status as TODO / In Progress / Done to reflect whether the follow-up is still outstanding._
