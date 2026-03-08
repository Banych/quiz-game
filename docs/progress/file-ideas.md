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
| src/hooks/use-player-session.ts                             | Add Vitest coverage for realtime cache updates + submission states once the hook stabilizes.               | TODO   |
| src/components/player/player-session-screen.tsx             | Add a Playwright smoke that walks `/join → /play` to cover timer UI + resume CTA behavior.                 | TODO   |

## R5 Known Issues & Future Improvements (2026-02-01)

### E2E Test Selector Issues
| Test File                                | Issue                                                         | Recommended Fix                                                                  |
| ---------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| e2e/host-dashboard.spec.ts:74            | Regex `/\d{2}:\d{2}/` matches timer AND "Started: 5:01:20 PM" | Scope to timer container: `page.locator('[data-testid="timer"]').getByText(...)` |
| e2e/player-connection-status.spec.ts:121 | `getByText('Connected')` matches summary AND badge            | Use specific role: `getByRole('status').filter({ hasText: 'Connected' })`        |
| Various player tests                     | Generic text selectors hit multiple elements                  | Add `data-testid` attributes to status badges and summary sections               |

**Priority:** Low - Tests work but have strict mode violations. Address in R6 polish phase.

### Performance Optimization Backlog
| Area                 | Current State | Target | Improvement Path                             |
| -------------------- | ------------- | ------ | -------------------------------------------- |
| Player Join Latency  | P95 6.29s     | <500ms | Supabase Connection Pooler, Edge Functions   |
| Answer Submission    | P95 1.63s     | <300ms | Redis cache for quiz state, batch operations |
| Heartbeat Round-Trip | P95 206ms     | <100ms | Edge Function for presence endpoint          |
| Cold Start           | ~2s           | <500ms | Prisma connection pooling, warm-up requests  |

**Priority:** Medium - Acceptable for <100 players, optimize before scaling.

### Technical Debt
| Item              | Description                                             | Priority |
| ----------------- | ------------------------------------------------------- | -------- |
| Integration Tests | No disposable DB tests for repositories                 | Medium   |
| Realtime Mock     | Tests use noop realtime client, missing WebSocket tests | Medium   |
| Type Safety       | Some internal functions still use broad types           | Low      |
| E2E Fixtures      | Could simplify with Playwright global setup             | Low      |

## R6 Phase 3 — Media Library Follow-ups (2026-03-08)

### Subfolder / Recursive Listing

Supabase Storage `list()` returns folder prefixes as entries alongside files. When images are uploaded with a path prefix (e.g. `questions/`), the root `list('')` call returns a `questions` entry with `size: 0` rather than the individual images inside it.

**Current behaviour:** flat `list('')` — shows folder entries as tiles with `0 B`.

**Enhancement options:**

| Option | Description | Effort |
|--------|-------------|--------|
| Recursive listing | After `list('')`, detect entries with `metadata == null` as folders and call `list(folder/)` for each; merge results | Low |
| Folder navigation | UI breadcrumb — click a folder tile to drill down into that prefix | Medium |
| Upload path normalisation | Change upload helpers to always write files to the bucket root (no subfolder prefix), so flat listing always works | Low |

**Recommended path:** Recursive listing — extend `listFiles` to detect folder entries (`f.metadata === null`) and recursively fetch their contents, then flatten. No UI changes needed.

**Files to touch:**
- `src/infrastructure/storage/supabase-storage.ts` — add recursion in `listFiles`
- `src/components/admin/media-library.tsx` — no changes needed once `listFiles` returns flat list

**Priority:** Low — cosmetic issue only; real image files still accessible via direct URL.

_Add new rows as you uncover ideas. Mark status as TODO / In Progress / Done to reflect whether the follow-up is still outstanding._
