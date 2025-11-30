# Step 1: Setup Project

This step locks in the tooling so every feature can follow the DTO → Entity → Service → Prisma Repo → Hook flow described in `docs/structure.md`.

## Checklist
- [x] Bootstrap Next.js (App Router + TypeScript) with **Yarn**.
- [x] Install Tailwind 4, shadcn, and TanStack Query.
- [x] Configure ESLint (flat), Prettier, and Vitest.
- [x] Add Prisma + Supabase plumbing and `.env.example` entries.
- [x] Verify `yarn dev`, `yarn lint`, `yarn test`, and `yarn build`.

## 1. Bootstrap via Yarn
```bash
yarn create next-app quiz-game --typescript --eslint --tailwind --app --src-dir --import-alias "@/*"
cd quiz-game
yarn
```
Commit `.nvmrc` + `yarn.lock` so everyone stays on the same toolchain.

## 2. Tailwind 4 + shadcn
- Tailwind 4 already pulls `@import "tailwindcss";` inside `src/app/globals.css`. Keep tokens/utilities there—avoid inline styles.
- Install the UI stack:
```bash
yarn add class-variance-authority clsx tailwind-merge lucide-react @radix-ui/react-slot shadcn-ui
```
- Run `yarn shadcn init` and place generated components under `src/components/ui`. Track the registry in `components.json`.

## 3. TanStack Query Baseline
```bash
yarn add @tanstack/react-query
```
- Create `src/hooks/query-client.ts` exporting a preconfigured `QueryClient`.
- Store feature hooks in `src/hooks/**`; they must call application services (never repositories) and manage TanStack cache updates.

## 4. ESLint, Prettier, Vitest
- Flat ESLint config lives in `eslint.config.mjs` (Next + React + CSS + Prettier). Update ignore paths when tooling outputs new folders.
- `.prettierrc` enforces shared formatting.
- Vitest is configured via `vitest.config.ts` (with `vite-tsconfig-paths`). Commands:
```bash
yarn lint
yarn test
yarn test:watch
yarn test:coverage
```

## 5. Prisma + Supabase Plumbing
```bash
yarn add @prisma/client
yarn add -D prisma
```
- The Prisma schema plus migrations live under `src/infrastructure/database/prisma/` (see `prisma.config.ts` for the custom path). Commit every migration in `migrations/` so Supabase/Postgres stay reproducible.
- `src/infrastructure/database/client.ts` exports the singleton Prisma client used across repositories.
- Use the shared Yarn scripts to manage the workflow:
	- `yarn prisma:generate` – refreshes the Prisma client after schema edits.
	- `yarn prisma:migrate -- --name <change>` – creates/applies migrations against `DATABASE_URL`.
	- `yarn prisma:seed` – runs `src/infrastructure/database/prisma/seed.ts`, which wipes the DB via `resetDatabase()` and inserts demo data using `seed-helpers.ts`.
- Repository implementations under `src/infrastructure/repositories/**` must depend on the Prisma client + mapping helpers only (never on React code).

## 6. Environment Files
Copy `.env.example` → `.env` and provide the required connection strings:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/quiz_game?schema=public"
SHADOW_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/quiz_game_shadow?schema=public"
DATABASE_URL_TEST="postgresql://USER:PASSWORD@HOST:5432/quiz_game_test?schema=public"
NEXT_PUBLIC_SUPABASE_URL="https://xyz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="public-anon-key"
SUPABASE_SERVICE_ROLE_KEY="service-role"
```
- `DATABASE_URL` points to the primary Postgres instance used for dev.
- `SHADOW_DATABASE_URL` is mandatory for `prisma migrate dev` against hosted providers (Supabase) so Prisma can run diffing safely.
- `DATABASE_URL_TEST` powers Vitest integration runs; wire it up once the test suite needs live repositories.
- Document and rotate additional env vars here whenever new infra (auth, realtime, analytics) is introduced. Never commit real credentials.

## 7. Verification Commands
```bash
yarn dev          # Next.js + Turbopack
yarn lint         # ESLint flat config
yarn test         # Vitest suite
yarn build && yarn start  # smoke prod build
```
All later steps assume these commands succeed locally.