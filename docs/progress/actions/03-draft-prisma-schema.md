# Action 03 – Draft Prisma Schema

- Introduced `src/infrastructure/database/prisma/schema.prisma` with enums for quiz/player/question states plus concrete models for `Quiz`, `Question`, `Player`, and `Answer`.
- Models align with DTO catalog: quizzes track timing/settings, questions include publication/order flags, players carry status/score/rank, and answers record timing/accuracy metadata.
- Datasource configuration now expects `prisma.config.ts` to supply `DATABASE_URL`, matching Prisma 5+ configuration guidance.
- Next migrations will run once repository implementations are ready; no database applied yet.
