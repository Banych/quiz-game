# Quiz Game Delivery Plan

## Vision Snapshot
- **Host/Admin desktop**: Runs the quiz, controls rounds, views live stats. Mirrors the layouts from the mockups (`docs/mockups/*.png`).
- **Player mobile**: Joins with a name/code, sees timers and answer inputs only (no questions) to keep the experience fair.
- **Round insights**: End-of-round summaries with correctness, speed, and leaderboard deltas.

## Personas & Primary Journeys
- **Host**: create session → load playlist of questions → run round → review stats → optionally restart.
- **Player**: join session → answer via mobile UI → watch timers/results.
- **Admin**: curate reusable quizzes, manage media, configure timings.

## Non‑Functional Goals
- Snappy realtime updates (<300 ms round trip) for answer/timer sync.
- Fault tolerance: reconnecting players rehydrate state.
- Observability: structured logs + basic telemetry hooks before public launch.
- Continuous testing (unit + Vitest integration) wired into CI and `yarn` scripts.

## Technology Choices
- **Frontend**: Next.js App Router + React Server/Client Components, Tailwind, shared UI primitives, TanStack Query for data fetching and cache invalidation, custom hooks for presentation logic.
- **State & realtime**: TanStack Query + lightweight signal stores for UI; WebSocket (likely `ws`/Socket.IO) channel per session for timers/answers.
- **Backend/data**: Prisma ORM targeting Supabase Postgres. DTOs map to Prisma models; repositories isolate persistence.
- **Hosting**: Vercel for host/admin UI + serverless routes. Consider Supabase Realtime or Pusher if Socket.IO on Vercel is limiting; alternative is Fly.io for a thin realtime worker if needed.
- **Media**: store structured metadata in Supabase, assets in Supabase Storage or Vercel Blob (TBD when we wire uploads).
- **Tooling**: Yarn as package manager, ESLint/Prettier/Vitest, Playwright (later) for flows.

## Release Roadmap
| Release                     | Goal                             | Scope / Acceptance                                                                                                                    |
| --------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **R0 – Foundation**         | Stable scaffolding               | Upgrade lint/test config, Tailwind, TanStack Query, Yarn scripts, CI smoke test, health page.                                         |
| **R1 – Domain & Data**      | DDD-lite core established        | DTO catalog, Prisma schema + migrations, repositories for Quiz/Player/Question, seed data, Supabase project wiring, SDK wrappers.     |
| **R2 – Host MVP**           | Run a scripted quiz from desktop | Host dashboard per mockups, question timeline view, timer component, TanStack hooks calling stubbed services, optimistic stats cards. |
| **R3 – Player MVP**         | Join + submit answers            | Join screen, answer pad, timer sync via WebSocket, player session persistence, latency budget instrumentation.                        |
| **R4 – Content Admin**      | Manage quizzes and media         | Auth gate, CRUD UI for quizzes/questions, uploads to Supabase storage, DTO validation, audit log.                                     |
| **R5 – Realtime & Scoring** | Production-ready game loop       | Full scoring logic, round transitions, leaderboard, reconnect flows, analytics events, load testing.                                  |
| **R6 – Polish & Launch**    | Fit/finish                       | Accessibility pass, responsive tweaks, marketing landing, incident docs, deployment promotion to Vercel prod.                         |

## Cross-Cutting Workstreams
- **Authentication & Sessions**: Supabase Auth or Vercel middleware; host/admin vs player roles defined in R1 but activated before R4.
- **Testing**: Unit coverage in every release, domain service integration tests, WebSocket contract tests post-R3.
- **Observability**: Structured logging adapters + feature flags, user journey analytics piped via Segment/PostHog (decide in R5).
- **Documentation**: Update plan + structure docs each release; ADRs for WebSocket hosting, media storage, auth provider.

## Dependencies & Open Questions
- Confirm whether Vercel Edge functions satisfy WebSocket needs; fallback is a small Node worker elsewhere.
- Decide on CDN/storage for heavy media (Supabase Storage vs Cloudinary) before R4.
- Determine branding assets for final polish; mockups currently guide spacing/layout only.
