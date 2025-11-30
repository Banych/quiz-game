# Action 02 – Audit Domain Repositories

- `src/domain/repositories/quiz-repository.ts` currently supports CRUD only; documented need for lookup by join code, status filtering, and partial persistence to avoid rewriting whole aggregates.
- `src/domain/repositories/player-repository.ts` lacks quiz scoping helpers such as `listByQuizId` or `findByQuizIdAndName`; upcoming Prisma layer must expose these so DTOs can include names/status.
- `src/domain/repositories/question-repository.ts` is unused beyond basic CRUD; R1 requires batch fetch by quiz and publication/order helpers to maintain question timelines.
- Notes are mirrored in `docs/progress/dev-notes.md` for quick reference before repository implementations land.
