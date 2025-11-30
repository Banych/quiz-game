# Session Targets — 2025-11-30 (Host MVP)

Tracking the follow-up focus block for November 30. Keep goals scoped to the host MVP + service layer deliverables and capture results below before opening another session file.

## Active Targets
- [x] Complete the DTO catalog pass: reconcile `src/application/dtos/**` with mockups and document any additions in `docs/progress/actions/01-define-dto-catalog.md`.
- [ ] Finish Prisma/repository parity: ensure schema + `src/infrastructure/repositories/**` rebuild aggregates exactly as `QuizSessionAggregate` expects, updating `docs/progress/actions/02-04` along the way.
- [ ] Build missing host MVP use cases/services (timer control, leaderboard snapshots, question advancement) with tests in `src/tests/application/**` and expose them through `getServices`.
- [ ] Wire the host dashboard page to real DTOs via TanStack Query hooks, mirroring `docs/mockups/*.png`, and note the progress in `docs/progress/dev-notes.md`.
- [ ] Stub the realtime adapter described in `docs/04-presentation-and-realtime.md` (even if it’s a no-op) so hooks can subscribe to future events.

## Completed This Session
- [x] Added `joinCode`, timer metadata, and question ordering to the DTO catalog so host/player flows have the data promised in the mockups (logged in `docs/progress/actions/01-define-dto-catalog.md`).
