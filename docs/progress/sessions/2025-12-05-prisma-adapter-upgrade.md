# 2025-12-05 – Prisma Adapter Upgrade

## Active Goals
- [ ] Swap Prisma client generator to the v7 driver adapter output and hub imports through a local barrel.
- [ ] Instantiate Prisma with `@prisma/adapter-pg` so builds stop demanding Accelerate/Data Proxy configs.
- [ ] Keep lint/build clean by ignoring generated Prisma sources and updating docs to reflect the new workflow.

## Completed
- [x] Added `@prisma/adapter-pg`, regenerated the client into `src/infrastructure/database/prisma/generated/client`, and created `generated-client.ts` for consistent imports.
- [x] Updated `schema.prisma`, Prisma repositories, seed helpers, and the database client to use the generated path + adapter while enforcing `DATABASE_URL`.
- [x] Recorded the new setup in `docs/01-setup-project.md` and `docs/progress/dev-notes.md`, refreshed ESLint ignores, and verified `yarn build` succeeds.

## Parking Lot / Follow-ups
- Capture a regression test that instantiates Prisma via `resetServices` to ensure the adapter wiring plays nicely with Vitest in-memory runs.
