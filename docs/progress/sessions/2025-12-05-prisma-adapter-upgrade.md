# 2025-12-05 – Prisma Adapter Upgrade

## Active Goals
- [x] Swap Prisma client generator to the v7 driver adapter output and hub imports through a local barrel.
- [x] Instantiate Prisma with `@prisma/adapter-pg` so builds stop demanding Accelerate/Data Proxy configs.
- [x] Keep lint/build clean by ignoring generated Prisma sources and updating docs to reflect the new workflow.

## Completed
- [x] Added `@prisma/adapter-pg`, regenerated the client into `src/infrastructure/database/prisma/generated/client`, and created `generated-client.ts` for consistent imports.
- [x] Updated `schema.prisma`, Prisma repositories, seed helpers, and the database client to use the generated path + adapter while enforcing `DATABASE_URL`.
- [x] Recorded the new setup in `docs/01-setup-project.md` and `docs/progress/dev-notes.md`, refreshed ESLint ignores, and verified `yarn build` succeeds.
- [x] 2025-12-08: Re-ran `yarn build` to confirm the v7 generator output + barrel wiring succeed end-to-end (Next.js production build passes locally).
- [x] 2025-12-08: Verified every Prisma entry point goes through `src/infrastructure/database/prisma/client` (which instantiates `PrismaPg` via `@prisma/adapter-pg`), ensuring Vercel builds no longer request Accelerate/Data Proxy flags.
- [x] 2025-12-08: Documented that `src/infrastructure/database/prisma/generated/` is ignored by Git + ESLint and re-ran `yarn lint` to confirm a clean pass with the adapter workflow.

## Parking Lot / Follow-ups
- Capture a regression test that instantiates Prisma via `resetServices` to ensure the adapter wiring plays nicely with Vitest in-memory runs.
