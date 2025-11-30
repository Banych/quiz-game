# Action 01 – Define DTO Catalog

- Added core schemas in `src/application/dtos/` for questions, players, answers, and quizzes using zod.
- Captured status enums plus leaderboard and quiz settings contracts so services/hooks can rely on a single shape.
- These DTOs now back future Prisma mappings and TanStack hooks; update this file whenever DTO shapes shift.
