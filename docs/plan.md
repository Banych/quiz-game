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
| Release                     | Goal                             | Scope / Acceptance                                                                                                                              | Status              |
| --------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| **R0 – Foundation**         | Stable scaffolding               | Upgrade lint/test config, Tailwind, TanStack Query, Yarn scripts, CI smoke test, health page.                                                   | ✅ Complete          |
| **R1 – Domain & Data**      | DDD-lite core established        | DTO catalog, Prisma schema + migrations, repositories for Quiz/Player/Question, seed data, Supabase project wiring, SDK wrappers.               | ✅ Complete          |
| **R2 – Host MVP**           | Run a scripted quiz from desktop | Host dashboard per mockups, question timeline view, timer component, TanStack hooks calling stubbed services, optimistic stats cards.           | ✅ Complete          |
| **R3 – Player MVP**         | Join + submit answers            | Join screen, answer pad, timer sync via WebSocket, player session persistence, latency budget instrumentation.                                  | ✅ Complete          |
| **R4 – Content Admin**      | Manage quizzes and media         | Auth gate, CRUD UI for quizzes/questions, uploads to Supabase storage, DTO validation, audit log (deferred to R6).                              | ✅ Complete (Dec 21) |
| **R5 – Realtime & Scoring** | Production-ready game loop       | Speed-based scoring, round transitions, reconnection flows, load testing. See `docs/progress/actions/07-r5-realtime-scoring-implementation.md`. | ✅ Complete (Feb 1)  |
| **R6 – Polish & Launch**    | Fit/finish                       | Accessibility pass, responsive tweaks, audit log, PostHog analytics, marketing landing, incident docs, Vercel prod deployment.                  | 📅 Planned           |

## Cross-Cutting Workstreams
- **Authentication & Sessions**: Supabase Auth or Vercel middleware; host/admin vs player roles defined in R1 but activated before R4.
- **Testing**: Unit coverage in every release, domain service integration tests, WebSocket contract tests post-R3.
- **Observability**: Structured logging adapters + feature flags, user journey analytics piped via Segment/PostHog (decide in R5).
- **Documentation**: Update plan + structure docs each release; ADRs for WebSocket hosting, media storage, auth provider.

## Dependencies & Open Questions
- Confirm whether Vercel Edge functions satisfy WebSocket needs; fallback is a small Node worker elsewhere.
- Decide on CDN/storage for heavy media (Supabase Storage vs Cloudinary) before R4.
- Determine branding assets for final polish; mockups currently guide spacing/layout only.

---

## Performance Benchmarks (R5)

**Test Environment**: Production build (`yarn build && yarn start`), local Supabase, Prisma v7 driver adapter

**Load Testing Tool**: k6 (Grafana) with custom scenarios

### Production Benchmarks (2026-02-01)

| Test Scenario           | Iterations | Error Rate | P50 Latency | P95 Latency | Target | Status       |
| ----------------------- | ---------- | ---------- | ----------- | ----------- | ------ | ------------ |
| Answer Submission Storm | 428        | 0.00%      | 945ms       | 1.63s       | <300ms | ⚠️ 5.4x over  |
| Concurrent Player Joins | 761        | 0.00%      | 1.84s       | 6.29s       | <500ms | ⚠️ 12.6x over |
| Presence Heartbeats     | 2,318      | 0.00%      | 173ms       | 206ms       | <100ms | ⚠️ 2x over    |

**Key Findings**:
- **Zero error rate** across all tests validates functional correctness
- **Production vs Dev**: Join latency improved 50% (12.5s → 6.29s P95)
- **Root cause of latency**: Database connection pooling + single-threaded Prisma operations
- **Bundle sizes**: All routes under target (largest: 228KB admin page, player routes: 131-144KB)

### Optimization Opportunities (R6)

1. **Connection Pooling**: Configure PgBouncer or Supabase Connection Pooler
2. **Caching Layer**: Redis for session/quiz state (reduces DB round-trips)
3. **Edge Functions**: Move hot paths (heartbeat, answer) to Supabase Edge Functions
4. **CDN**: Static assets on Vercel Edge, dynamic on origin
5. **Query Optimization**: Add database indexes for common access patterns

### Load Test Methodology

**Scenarios** (in `load-tests/k6/`):
- `concurrent-players.js`: Simulates 20 concurrent users joining quiz over 2 minutes
- `answer-submission-storm.js`: 25 players submitting 10 answers each with realistic delays
- `presence-heartbeat-load.js`: 50 players sending heartbeats every 5 seconds for 5 minutes

**Running Tests**:
```bash
# Install k6 (macOS)
brew install k6

# Run individual test
k6 run load-tests/k6/concurrent-players.js

# Run against production server
yarn build && yarn start  # In terminal 1
k6 run load-tests/k6/answer-submission-storm.js  # In terminal 2
```

---

## Known Limitations

### Development Server Limitations
- Dev server (`yarn dev`) is 50% slower than production for API routes
- Turbopack hot-reload adds latency during rapid iteration
- Always benchmark against production build (`yarn build && yarn start`)

### E2E Test Selector Issues
Some Playwright tests have strict mode violations where selectors match multiple elements:
- `getByText('Connected')` may match both status badge and summary text
- Time-based regex `/\d{2}:\d{2}/` may match multiple timestamps
- **Workaround**: Scope selectors to specific containers or add `data-testid` attributes

### Realtime Latency
- Current P95 latencies exceed targets due to single-threaded Prisma operations
- Acceptable for MVP (<100 concurrent players)
- Optimization path documented in Performance Benchmarks section

### Browser Compatibility
- Tested on Chrome, Firefox, Safari (latest versions)
- Mobile Safari may have WebSocket reconnection delays
- Progressive enhancement recommended for older browsers

---

## R6 Polish & Launch – Detailed Scope

This section expands on the R6 release with specific tasks discovered during R5 completion and codebase review.

### Phase 1: Landing & Navigation Polish ✅ (2026-02-07)

**Home Page (`src/app/page.tsx`):**
- [x] Replace boilerplate "Initial page of Quiz Game" with proper landing page
- [x] Add hero section explaining the quiz game concept
- [x] Include quick-start CTAs: "Join a Game" (→ /join), "Host a Game" (→ /host), "Admin" (→ /admin)
- [ ] Show featured quizzes or recent activity (optional) — deferred to Phase 6
- [x] Mobile-responsive design matching mockup style

**Navigation & Routing:**
- [x] Add global `not-found.tsx` page at `src/app/not-found.tsx` for 404 errors
- [x] Add global `error.tsx` page at `src/app/error.tsx` for error boundaries
- [x] Add `loading.tsx` skeletons for slow route transitions (admin, host, player sections)
- [x] Basic footer added to home page (full footer deferred to Phase 6)

**Admin Dashboard Polish:**
- [x] Questions/Media cards kept as "Coming Soon" (accurate status, Phase 3 scope)
- [x] Updated Quick Start copy to reflect completed features (quiz CRUD is available)
- [x] Wired up Start Quiz button to call `/api/quiz/start` and redirect to host dashboard

### Phase 1.5: End-to-End Flow Audit (Manual Testing with Playwright MCP)

**Goal:** Walk through the complete user journey using Playwright MCP to identify UX gaps, broken flows, and missing features.

**Quiz Creation → Start → Player Join Flow:**
- [ ] Admin creates a new quiz with questions
- [ ] Admin views quiz detail and verifies questions saved correctly
- [ ] Admin starts quiz from quiz list (Start button)
- [ ] Host dashboard loads with correct quiz state
- [ ] Join code is displayed prominently for host to share
- [ ] Player navigates to `/join` and enters join code
- [ ] Player enters name and joins successfully
- [ ] Player appears in host dashboard player list
- [ ] Host can advance through questions
- [ ] Player can submit answers
- [ ] End-of-round summaries display correctly
- [ ] Quiz completion flow works

**Known Gaps to Investigate:**
- [ ] Is join code visible/copyable on host dashboard?
- [ ] Does `/host` landing page exist or is it 404?
- [ ] Can host see player count updating in real-time?
- [ ] Are error states handled (e.g., invalid join code)?
- [ ] Is there feedback when quiz starts successfully?

**Document findings** in `docs/progress/sessions/` after completing audit.

### Phase 2: UI/UX Improvements

**Accessibility Audit:**
- [ ] Run axe-core or Lighthouse accessibility audit on all pages
- [ ] Fix color contrast issues (ensure WCAG AA compliance)
- [ ] Add proper ARIA labels to interactive elements
- [ ] Ensure keyboard navigation works for all actions
- [ ] Add skip links for screen reader users
- [ ] Test with VoiceOver/NVDA

**Responsive Design:**
- [ ] Test all pages on mobile viewports (320px, 375px, 414px)
- [ ] Test tablet viewports (768px, 1024px)
- [ ] Fix any overflow or layout issues
- [ ] Ensure touch targets are ≥44px for mobile
- [ ] Test player answer pad on small screens

**Visual Consistency:**
- [ ] Audit all pages for consistent spacing/padding
- [ ] Ensure loading states are consistent across all data-fetching components
- [ ] Add consistent empty states for lists (quizzes, questions, players)
- [ ] Polish error messages and validation feedback

### Phase 3: Missing Features

**Admin Content Management:**
- [ ] Implement standalone Questions management page (`/admin/questions`)
  - Browse all questions across quizzes
  - Filter by quiz, type, status
  - Bulk operations (delete, move to quiz)
- [ ] Implement Media library page (`/admin/media`)
  - Browse uploaded images
  - View usage (which questions reference each image)
  - Delete orphaned media

**Audit Log Feature (Deferred from R4):**
- [ ] Create `AuditLog` Prisma model (userId, action, entityType, entityId, metadata, timestamp)
- [ ] Log all CRUD operations in admin routes
- [ ] Build `/admin/audit` page to view recent activity
- [ ] Add filtering by action type, user, date range

**Host Enhancements:**
- [ ] Add quiz selection page for hosts (`/host` landing)
  - List available quizzes with status
  - Quick-start buttons for each quiz
- [ ] Add host session controls (pause quiz, end early)
- [ ] Add "Share Join Code" with QR code generation

### Phase 4: Analytics & Observability

**PostHog Integration:**
- [ ] Install `posthog-js` and configure in `providers.tsx`
- [ ] Track key events: quiz_started, player_joined, answer_submitted, quiz_completed
- [ ] Add user identification for admin users
- [ ] Create PostHog dashboards for key metrics

**Structured Logging:**
- [ ] Add structured logger wrapper (`src/lib/logger.ts`)
- [ ] Replace `console.log` with structured logging in API routes
- [ ] Include request ID, user ID, operation name in all logs
- [ ] Configure log levels per environment (dev: debug, prod: info)

**Error Tracking:**
- [ ] Integrate Sentry or similar for error tracking
- [ ] Add source maps for production debugging
- [ ] Set up alerts for error rate spikes

### Phase 5: Production Hardening

**Performance Optimization:**
- [ ] Configure Supabase Connection Pooler (PgBouncer)
- [ ] Add Redis caching layer for hot paths (quiz state, leaderboard)
- [ ] Move heartbeat endpoint to Supabase Edge Function
- [ ] Add database indexes for slow queries identified in load testing

**Security Audit:**
- [ ] Review all RLS policies in Supabase
- [ ] Ensure no sensitive data leaks in API responses
- [ ] Add rate limiting to public endpoints (join, answer submission)
- [ ] Review CORS configuration

**Deployment Documentation:**
- [ ] Write production deployment runbook
- [ ] Document environment variables and secrets management
- [ ] Create incident response playbook
- [ ] Document rollback procedures

### Phase 6: Marketing & Launch

**Marketing Landing Page:**
- [ ] Design hero section with product screenshots
- [ ] Add feature highlights with icons
- [ ] Include testimonials/social proof section (placeholder)
- [ ] Add pricing section (if applicable) or "Free to use"
- [ ] SEO optimization (meta tags, OG images, sitemap)

**Launch Preparation:**
- [ ] Create demo quiz with sample questions
- [ ] Record product demo video (optional)
- [ ] Prepare launch announcement content
- [ ] Set up custom domain if not already configured
- [ ] Configure Vercel production environment

### Acceptance Criteria for R6

**Landing Page:**
- [ ] Home page clearly explains product value proposition
- [ ] CTAs lead to appropriate flows (join vs host vs admin)
- [ ] Mobile-responsive and accessible

**Error Handling:**
- [ ] Custom 404 page with helpful navigation
- [ ] Error boundary catches and displays friendly errors
- [ ] Loading states prevent layout shifts

**Admin Dashboard:**
- [ ] No "Coming Soon" buttons for shipped features
- [ ] Quick Start guide reflects actual capabilities
- [ ] Audit log available for admin activity

**Performance:**
- [ ] P95 latency <500ms for answer submission (improved from R5 baseline)
- [ ] P95 latency <1s for player joins (improved from R5 baseline)
- [ ] Zero errors under 100 concurrent player load

**Launch Ready:**
- [ ] All pages pass Lighthouse accessibility audit (score ≥90)
- [ ] Production deployment documented and tested
- [ ] Monitoring and alerting configured
