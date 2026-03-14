# R6 Phase 3 — Missing Features

**Date:** 2026-03-08
**Status:** ✅ Complete (All 5 Steps Done)
**Depends on:** R6 Phase 2 ✅

---

## Overview

Phase 3 completes five features deferred from earlier releases. The codebase already has all the CRUD APIs, DTOs, and component building blocks — this phase wires them into new standalone pages and adds two new capabilities (audit log, QR codes).

**Current state:**
- Admin dashboard has "Coming Soon" buttons for Questions and Media
- No `/host` landing page — hosts must navigate directly to `/quiz/[quizId]`
- Join codes displayed as text only; no QR code
- No audit log infrastructure

---

## Goals

- [x] Host quiz selection page at `/host`
- [x] QR code display in lobby view alongside join code
- [x] Standalone questions management page at `/admin/questions`
- [x] Media library page at `/admin/media`
- [x] Audit log feature at `/admin/audit`

---

## Reusable Existing Code

| Asset | Path |
|-------|------|
| Question CRUD APIs | `src/app/api/admin/quizzes/[quizId]/questions/` |
| Admin components | `src/components/admin/question-list.tsx`, `create-question-dialog.tsx`, `edit-question-dialog.tsx`, `delete-question-dialog.tsx` |
| DTOs | `src/application/dtos/quiz-admin.dto.ts`, `question-admin.dto.ts` |
| Storage service | `src/infrastructure/storage/supabase-storage.ts` |
| Join code util | `src/lib/join-code.ts` |
| Quiz list API | `GET /api/admin/quizzes` → `QuizListItemDTO[]` |
| Service factory | `src/application/services/factories.ts` → `getServices()` |

---

## Implementation Steps

### Step 1 — Host Quiz Selection Page (`/host`) · Small

- [x] Create `src/app/(host)/host/page.tsx` — server component, calls `quizService.listQuizzes()` via `getServices()`
- [x] Display quiz cards: title, status badge, question count, player count, join code
- [x] Link cards to `/quiz/[quizId]` (dashboard) and `/quiz/[quizId]/live` (live view)
- [x] Update `src/app/page.tsx` — change "Host Game" CTA from `/admin/quizzes` to `/host`
- [x] Run `yarn test` ✅

### Step 2 — QR Code for Join Codes · Small

- [x] `yarn add qrcode.react`
- [x] Modify `src/components/host/live/lobby-view.tsx` — import `QRCodeSVG` from `qrcode.react`
- [x] Encode full join URL: `${window.location.origin}/join?code={joinCode}`
- [x] Display 200×200px QR code beside join code text with `aria-label="QR code for join link"`
- [x] Playwright MCP spot-check in lobby view ✅
- [x] **Bug fix:** replaced `typeof window !== 'undefined'` inline ternary with `useState(null)` + `useEffect` — SSR rendered a relative path (`/join?code=XXXX`) causing React hydration mismatch and QR codes that phone scanners couldn't navigate to; now QR is suppressed on SSR and only rendered client-side with the full absolute URL
- [x] **Prefill fix:** `src/app/(player)/join/page.tsx` + `PlayerJoinForm` — `useSearchParams()` reads `?code=` on mount and pre-fills the join code field; wrapped page in `<Suspense>` as required by Next.js for `useSearchParams`; scanning QR now lands on `/join` with code pre-filled

### Step 3 — Standalone Questions Page (`/admin/questions`) · Medium

- [x] Extend `QuestionListItemDTO` to include `quizId` and `quizTitle` fields (additive, no breaking changes) in `src/application/dtos/question-admin.dto.ts`
- [x] Create `src/application/use-cases/list-all-questions.use-case.ts` — `ListAllQuestionsUseCase.execute({ quizId?, type? })` (placed flat, not in subdirectory, matching codebase convention)
- [x] Create `src/app/api/admin/questions/route.ts` — `GET /api/admin/questions?quizId=&type=`
- [x] Create `src/components/admin/all-questions-view.tsx` — client component with quiz filter dropdown, question table, edit/delete actions
- [x] Create `src/app/(admin)/admin/questions/page.tsx` — client component rendering `<AllQuestionsView />`
- [x] Modify `src/app/(admin)/admin/page.tsx` — remove `disabled` and "Coming Soon" from Questions button
- [x] Write `src/tests/application/use-cases/list-all-questions.use-case.test.ts` (5 tests: success, filtered-by-quizId, filtered-by-type, empty, null-quiz)
- [x] Run `yarn test` ✅ — 374 tests pass (5 new)
- [x] Playwright MCP spot-check: dashboard → Questions card navigates to `/admin/questions`, all-quizzes table shows questions with Quiz column, filter dropdown scopes to selected quiz, Add Question button appears on quiz filter, edit dialog opens with question prefilled

### Step 4 — Media Library Page (`/admin/media`) · Medium

- [x] Add `listFiles({ bucket, path? }): Promise<StorageFile[]>` to `IStorageService` interface (`src/infrastructure/storage/storage-service.ts`)
- [x] Implement `listFiles` in `SupabaseStorageService` using `storage.from(bucket).list(path)` (`src/infrastructure/storage/supabase-storage.ts`)
- [x] Create `src/application/dtos/media.dto.ts` — `MediaFileDTO { name, path, url, size, createdAt }`
- [x] ~~Create `src/app/api/admin/media/route.ts`~~ — skipped; client-side `SupabaseStorageService` used directly (matches existing upload pattern)
- [x] Create `src/components/admin/media-library.tsx` — grid of image thumbnails with delete buttons
- [x] Create `src/app/(admin)/admin/media/page.tsx` — server component rendering `<MediaLibrary />`
- [x] Modify `src/app/(admin)/admin/page.tsx` — remove `disabled` and "Coming Soon" from Media button
- [x] Run `yarn test` ✅ — 374 tests pass

### Step 5 — Audit Log Feature · Large

- [x] Create `src/domain/entities/audit-log.ts` — `AuditLog` entity with `id`, `quizId?`, `actorId?`, `eventType` (enum), `metadata` (JSON), `createdAt`
- [x] Create `src/domain/repositories/audit-log-repository.ts` — `IAuditLogRepository` interface: `save(log)`, `findByQuizId(quizId, limit)`, `findRecent(limit)`
- [x] Add `AuditLog` table to `src/infrastructure/database/prisma/schema.prisma`
- [x] Run `yarn prisma:migrate` to create migration (`20260308164750_add_audit_logs_table`)
- [x] Create `src/infrastructure/repositories/prisma-audit-log.repository.ts`
- [x] Create `src/application/dtos/audit-log.dto.ts` — `AuditLogDTO { id, quizId?, eventType, summary, metadata, createdAt }`
- [x] Create `src/application/use-cases/audit/log-event.use-case.ts`
- [x] Create `src/application/use-cases/audit/list-audit-logs.use-case.ts`
- [x] Wire audit log emissions (fire-and-forget) into: `CreateQuizUseCase`, `StartQuizUseCase`, `AdvanceQuestionUseCase`, `LockQuestionUseCase`
- [x] Create `src/app/api/admin/audit/route.ts` — `GET /api/admin/audit?quizId=&limit=`
- [x] Create `src/components/admin/audit-log-table.tsx`
- [x] Create `src/app/(admin)/admin/audit/page.tsx`
- [x] Write domain + use-case tests (14 new tests)
- [x] Run `yarn test` ✅ — 388 tests pass (14 new)

---

## Technical Decisions

**Step 3 — Cross-quiz question listing:**
Extend `QuestionListItemDTO` with optional `quizId`/`quizTitle` instead of a new DTO. The new use case calls `quizRepo.findAll()` to get all quizzes, then `questionRepo.findByQuizId()` for each. Simple, no new infrastructure needed.

**Step 4 — Media library:**
Supabase Storage's `storage.from(bucket).list(path)` returns file metadata. The server-side API route calls this and returns `MediaFileDTO[]`. Client renders a thumbnail grid. Delete calls the API route which calls `IStorageService.delete()`.

**Step 5 — Audit log emission:**
Use fire-and-forget (`void auditService.log(...)`) inside existing use cases so audit failures never block quiz operations. No domain coupling — the audit service is injected via service factory.

---

## Files Changed

### New Files
| File | Purpose |
|------|---------|
| `src/app/(host)/host/page.tsx` | Host quiz selection landing |
| `src/app/(admin)/admin/questions/page.tsx` | Standalone questions page |
| `src/app/(admin)/admin/media/page.tsx` | Media library page |
| `src/app/(admin)/admin/audit/page.tsx` | Audit log viewer |
| `src/app/api/admin/questions/route.ts` | Cross-quiz questions API |
| `src/app/api/admin/media/route.ts` | Media list/delete API |
| `src/app/api/admin/audit/route.ts` | Audit log API |
| `src/components/admin/all-questions-view.tsx` | Cross-quiz question table |
| `src/components/admin/media-library.tsx` | Media thumbnail grid |
| `src/components/admin/audit-log-table.tsx` | Audit log table |
| `src/application/use-cases/question/list-all-questions.use-case.ts` | List questions cross-quiz |
| `src/application/use-cases/audit/log-event.use-case.ts` | Write audit event |
| `src/application/use-cases/audit/list-audit-logs.use-case.ts` | Read audit events |
| `src/application/dtos/media.dto.ts` | MediaFileDTO |
| `src/application/dtos/audit-log.dto.ts` | AuditLogDTO |
| `src/domain/entities/audit-log.ts` | AuditLog entity |
| `src/domain/repositories/audit-log-repository.ts` | IAuditLogRepository |
| `src/infrastructure/repositories/prisma-audit-log.repository.ts` | Prisma implementation |

### Modified Files
| File | Change |
|------|--------|
| `src/app/page.tsx` | "Host Game" CTA → `/host` |
| `src/app/(admin)/admin/page.tsx` | Remove "Coming Soon" for Questions and Media |
| `src/components/host/live/lobby-view.tsx` | Add QR code via `qrcode.react` |
| `src/application/dtos/question-admin.dto.ts` | Add `quizId?`, `quizTitle?` to `QuestionListItemDTO` |
| `src/infrastructure/storage/storage-service.ts` | Add `listFiles` to interface |
| `src/infrastructure/storage/supabase-storage.ts` | Implement `listFiles` |
| `src/infrastructure/database/prisma/schema.prisma` | Add `AuditLog` model (Step 5) |

---

## Success Criteria

- All 369 existing tests still pass after each step
- `yarn build` succeeds
- `yarn lint` clean
- `/host` shows quiz list; clicking navigates to dashboard
- Lobby view shows QR code that scans to join URL
- `/admin/questions` shows all questions filterable by quiz
- `/admin/media` shows image grid with working delete
- `/admin/audit` shows quiz lifecycle events

---

## Completion Checklist

- [x] `yarn test` — 388 tests pass (374 original + 14 new)
- [x] `yarn build` — production build succeeds
- [x] `yarn lint` — no errors
- [x] Playwright MCP spot-check on all new pages ✅
- [x] Update `docs/progress/PROGRESS.md` — mark Phase 3 tasks complete
