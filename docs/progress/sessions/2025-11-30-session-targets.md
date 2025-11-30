# Session Targets — 2025-11-30

Use this checklist to track the current work-in-progress items for the release. Mark boxes as work finishes, and start a new file under `docs/progress/sessions/` for future dates to preserve history.

## Active Targets
- [ ] Implement Prisma-backed quiz/question/answer repositories plus shared mapping helpers and unit tests.
- [ ] Finalize the Prisma workflow (migrations under `src/infrastructure/database/prisma/migrations`, add `prisma:generate`/`prisma:migrate` scripts, seed helpers).
- [ ] Recreate `.env.example` and update `docs/01-setup-project.md` with DATABASE_URL/shadow DB onboarding + Prisma command references.
- [ ] Stub the initial API routes under `src/app/api/**` (join session, add player, start quiz, submit answer) calling the application layer with DTO validation.
- [ ] Add a Prisma-backed integration test in `src/tests/integration/**` that exercises a repository → use case flow against a disposable database.

## Completed This Session
- [x] Extend domain repository interfaces (quiz/player/question) with share-code lookups, quiz scoping, and partial update helpers.
