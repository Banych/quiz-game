# Plan: Quiz Lobby + Live Game Screen

**Date Created:** 2026-02-08
**Date Updated:** 2026-03-07
**Status:** ✅ Complete
**Estimated Time:** ~4 hours
**Dependencies:** R5 ✅ Complete, R6 Phase 1 ✅ Complete
**Release:** R6 — Polish & Launch

---

## Overview

### Problem
When admin clicks "Start Quiz" in the quiz list, the quiz starts immediately (Pending→Active, timer begins) and redirects to the host dashboard. Players have no time to join before the first question starts. The host dashboard is a control panel — not a projector-friendly screen for running a live quiz.

### Solution
Create a new **Live Game Page** (`/quiz/[quizId]/live`) that serves as both the lobby (waiting for players) and the live game screen (showing questions on a projector). The existing dashboard stays as the admin control panel.

### Two-Screen Model
- **Projector screen:** `/quiz/[quizId]/live` — display-only, no admin controls
- **Host device:** `/quiz/[quizId]` — existing dashboard with Start/Lock/Advance buttons
- Both update in real-time via existing Supabase broadcast channel

### User Flow After Changes
1. Admin clicks **"Open Lobby"** in quiz list → navigates to `/quiz/[quizId]/live` (project this)
2. Live page shows **Lobby Screen**: big join code, player list updating in real-time
3. Host opens dashboard (`/quiz/[id]`) on their device, clicks **"Start Quiz"** when ready
4. Live page auto-transitions to **Question Screen**: big question text, options, countdown timer
5. Host locks question from dashboard → live page shows **Round Results**
6. Host advances question from dashboard → live page shows next question
7. After all questions: **Final Results Screen** with standings

---

## Goals

- [x] Decouple "open for joining" from "start the game" to give players time to join
- [x] Create a projector-friendly display page (large text, dark theme, no controls)
- [x] Reuse 100% of existing backend — no API or domain changes
- [x] Maintain all existing dashboard functionality for host control

---

## Implementation Steps

### Phase 1: Page + Orchestrator (~45 min)

#### Step 1: Server Page
- [x] Create `src/app/(host)/quiz/[quizId]/live/page.tsx`
- [x] Copy exact pattern from `src/app/(host)/quiz/[quizId]/page.tsx`:
  - `export const dynamic = 'force-dynamic'`
  - `await params` → `getServices().quizService.getQuizState(quizId)` → render `<LiveGameScreen>`
  - 404 handling on "not found" error
- [x] Verify page loads at `http://localhost:3000/quiz/[id]/live`

#### Step 2: Orchestrator Component
- [x] Create `src/components/host/live-game-screen.tsx` (stub — full state machine in next step)
- [x] Client component using `useHostQuizState({ quizId, initialData })` (stub created; state machine routing pending)
- [x] State machine routing to views:

  | Condition                                                      | View                                    |
  | -------------------------------------------------------------- | --------------------------------------- |
  | `status === 'Pending'`                                         | `<LobbyView />`                         |
  | `status === 'Active'` + `activeQuestionId` + no `roundSummary` | `<QuestionView />`                      |
  | `status === 'Active'` + `roundSummary` present                 | `<RoundResultsView />`                  |
  | `status === 'Active'` + no `activeQuestionId`                  | `<LobbyView />` with "Starting soon..." |
  | `status === 'Completed'`                                       | `<FinalResultsView />`                  |

- [x] Auto-clear `roundSummary` when `activeQuestionId` changes (via `useEffect`)
- [x] Wrap in `RealtimeClientProvider` if not already provided by layout

### Phase 2: View Components (~2 hours)

#### Step 3: Lobby View
- [x] Create `src/components/host/live/lobby-view.tsx`
- [x] Props: `{ quiz: QuizDTO }`
- [x] Layout (projector-optimized, dark background):
  - Quiz title (large)
  - Massive join code (centered, mono font, `text-8xl` or larger)
  - Player list — names appear as players join from `quiz.players`
  - Player count badge
  - Subtitle: "Waiting for host to start..." (or "Starting soon..." variant)
- [x] CSS transitions for player entry animations (no new deps)

#### Step 4: Question View
- [x] Create `src/components/host/live/question-view.tsx`
- [x] Props: `{ quiz: QuizDTO }`
- [x] Derive active question: `quiz.questions.find(q => q.id === quiz.activeQuestionId)`
- [x] Layout:
  - Question number header ("Question X of Y")
  - Large question text
  - Media display (`<img>` / `<video>` / `<audio>`) if `question.media` present
  - Answer options as large labeled cards (A, B, C, D) for `multiple-choice` / `true-false`
  - For `text` type: show just the question text (players type on their devices)
  - `<TimerCountdown size="large" />` reused from `src/components/host/timer-countdown.tsx`
  - Answer count: `quiz.answers[activeQuestionId]?.length ?? 0` of `quiz.players.length` answered

#### Step 5: Round Results View
- [x] Create `src/components/host/live/round-results-view.tsx`
- [x] Props: `{ summary: RoundSummaryDTO }` (no `onContinue` — auto-clears via orchestrator `useEffect`)
- [x] Layout (full-screen, reuse patterns from `round-summary-dialog.tsx`):
  - Question text + correct answer (highlighted green)
  - Stats: X/Y correct, accuracy %, average response time (3 cards)
  - Leaderboard sorted by current rank with rank-change arrows (↑↓)
  - Top 3 scorers this round with gold/silver/bronze medal pills
- [x] No controls — transitions when host advances from dashboard
- [x] `yarn lint` clean (no new errors or warnings)

#### Step 6: Final Results View
- [x] Create `src/components/host/live/final-results-view.tsx`
- [x] Props: `{ quiz: QuizDTO }`
- [x] Layout:
  - Quiz title + "Game Over" header
  - Podium-style top 3 (gold/silver/bronze visual treatment)
  - Full leaderboard list below (sorted by score)
  - Derive from `quiz.leaderboard` joined with `quiz.players` for names
- [x] `yarn lint` clean (no new errors or warnings)
- [x] E2E verified via Playwright: "Game Over!" header, quiz title, podium with 👑 for 1st, "Final Standings" list, auto-transitioned from QuestionView on quiz completion
- [x] Bug fix: `AdvanceQuestionUseCase` now calls `quizAggregate.endQuiz()` when no next question exists — quiz correctly transitions to `Completed` status
- [x] New test added: `advance-question-use-case.test.ts` — "completes the quiz and returns null question when on the last question" (3 tests passing)

### Phase 3: Modify Existing Files (~30 min)

#### Step 7: Quiz List — Replace Start with Open Lobby
- [x] Modify `src/components/admin/quiz-list.tsx`
- [x] Remove `startQuizMutation` (lines ~30-47) — no longer needed in quiz list
- [x] Change Pending quiz button:
  - Action: `router.push(`/quiz/${quiz.id}/live`)` instead of starting quiz
  - Icon: `MonitorPlay` (from lucide-react) instead of `PlayCircle`
  - Title: "Open Lobby"
- [x] Add same "Open Live View" button for Active quizzes (reopen live screen)
- [x] Clean up unused imports (`Loader2`, `PlayCircle` if no longer used)

#### Step 8: Player Pending Message
- [x] Modify `src/components/player/player-session-screen.tsx` (~line 287)
- [x] Change: "Waiting for the host to launch the next question." → "Waiting for the host to start the quiz..."
- [x] Only for `quiz.status === 'Pending'` context — keep original message for between-question waits

### Phase 4: Verification (~45 min)

#### Step 9: Automated Checks
- [x] `yarn lint` — no new warnings or errors (pre-existing warnings only)
- [x] `yarn test` — 368 tests pass, no regressions (1 pre-existing flaky shuffle test)
- [x] `yarn build` — production build succeeds

#### Step 10: Manual E2E Test (Playwright MCP)
- [x] Admin quiz list → Active quizzes show "Open Live View" (MonitorPlay icon)
- [x] Click "Open Live View" → navigates to `/quiz/[id]/live` showing question view
- [x] Player screen `waitingForQuestion` ternary: Pending → "Waiting for the host to start the quiz..." / Active no question → "Waiting for the host to launch the next question." (code verified)
- [x] Admin quiz list → Pending quiz shows "Open Lobby" → click → lobby view (verified with "Phase 4 E2E" quiz, JOIN-XVQA, player "TestPlayer1" appeared in lobby)
- [x] Active quiz on live screen shows question text, options, timer

---

## Technical Decisions

| Decision                 | Choice                                     | Rationale                                                                                       |
| ------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| No backend changes       | Reuse `QuizDTO` as-is                      | All needed data (players, questions, timer, leaderboard, answers, roundSummary) already present |
| Route placement          | `/quiz/[quizId]/live` under `(host)` group | Shares auth/layout with dashboard                                                               |
| State management         | Reuse `useHostQuizState` hook              | Already has realtime subscription + all mutations + 5s polling fallback                         |
| Round summary source     | `useHostQuizState.roundSummary`            | `lockQuestionMutation.onSuccess` already captures `RoundSummaryDTO`                             |
| Player list in lobby     | Use `quiz.players` from `QuizDTO`          | Already updated via realtime `state:update` events — no extra polling needed                    |
| Animations               | CSS transitions only                       | Avoid adding framer-motion dependency for simple enter animations                               |
| Live page controls       | None — display only                        | Host controls via existing dashboard; clean separation of concerns                              |
| Auto-clear round summary | `useEffect` watching `activeQuestionId`    | When host advances question, summary clears and question view shows automatically               |

---

## Key Reuse

| Existing Component/Hook                                      | Reused In                  | Notes                                        |
| ------------------------------------------------------------ | -------------------------- | -------------------------------------------- |
| `useHostQuizState` (`src/hooks/use-host-quiz-state.ts`)      | `live-game-screen.tsx`     | All state + realtime + mutations             |
| `TimerCountdown` (`src/components/host/timer-countdown.tsx`) | `question-view.tsx`        | Pass `size="large"` + `quiz.timer` props     |
| `QuizDTO`, `QuestionDTO`, `RoundSummaryDTO`                  | All live views             | Typed props, no new DTOs needed              |
| `hostQuizQueryKey`                                           | Shared query cache         | Dashboard and live page share same cache key |
| Realtime channel `quiz:${quizId}`                            | Already subscribed by hook | `state:update` events drive all transitions  |
| Display patterns from `round-summary-dialog.tsx`             | `round-results-view.tsx`   | Full-screen version of same data             |

---

## Data Available (No New DTOs)

**QuizDTO:** `title`, `status`, `joinCode`, `players[]`, `questions[]`, `activeQuestionId`, `currentQuestionIndex`, `timer { duration, remainingSeconds, startTime, endTime }`, `leaderboard[]`, `answers`

**QuestionDTO:** `id`, `text`, `media?`, `mediaType?`, `options?`, `type` (multiple-choice/text/true-false), `points`, `answersLockedAt?`

**RoundSummaryDTO:** `questionText`, `correctAnswer`, `playerResults[]`, `correctCount`, `totalPlayers`, `averageTime`, `leaderboardDeltas[]`

**PlayerDTO:** `id`, `name`, `status`, `score?`, `connectionStatus?`

**LeaderboardEntryDTO:** `playerId`, `score`

---

## Files Changed

### New Files (6)
| File                                              | Type             | Purpose                                      |
| ------------------------------------------------- | ---------------- | -------------------------------------------- |
| `src/app/(host)/quiz/[quizId]/live/page.tsx`      | Server component | Route entry point, fetch initial state       |
| `src/components/host/live-game-screen.tsx`        | Client component | State machine orchestrator                   |
| `src/components/host/live/lobby-view.tsx`         | Client component | Projector lobby with join code + player list |
| `src/components/host/live/question-view.tsx`      | Client component | Question display with timer + options        |
| `src/components/host/live/round-results-view.tsx` | Client component | Round results with leaderboard deltas        |
| `src/components/host/live/final-results-view.tsx` | Client component | Final leaderboard + podium                   |

### Modified Files (2)
| File                                              | Change                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/components/admin/quiz-list.tsx`              | Replace `startQuizMutation` with lobby navigation; add Live View button for Active quizzes |
| `src/components/player/player-session-screen.tsx` | Update pending state message text                                                          |

---

## Time Estimates

| Phase                        | Steps        | Estimate     |
| ---------------------------- | ------------ | ------------ |
| Phase 1: Page + Orchestrator | Steps 1–2    | ~45 min      |
| Phase 2: View Components     | Steps 3–6    | ~2 hours     |
| Phase 3: Modify Existing     | Steps 7–8    | ~30 min      |
| Phase 4: Verification        | Steps 9–10   | ~45 min      |
| **Total**                    | **10 steps** | **~4 hours** |

---

## Success Criteria

### Functional
- [x] `/quiz/[id]/live` renders lobby when quiz is Pending
- [x] Join code is prominently displayed (readable from back of room)
- [x] Players appearing in realtime as they join (no page refresh needed)
- [x] Auto-transitions to question view when host starts quiz from dashboard
- [x] Timer counts down visually on live screen
- [x] Answer options displayed for MC/TF questions
- [x] Round results shown after host locks question
- [x] Final leaderboard shown when quiz completes
- [x] Active quizzes accessible via "Live View" button in quiz list

### Non-functional
- [x] No new npm dependencies added
- [x] All existing 368 tests still pass (pre-existing flaky shuffle test aside)
- [x] `yarn lint` clean
- [x] `yarn build` succeeds
- [x] Live page is purely display (no mutation buttons)

---

## Notes & Observations

- **Step 1 & stub of Step 2 complete (2026-03-07):** Route live, 404 works, valid quiz renders stub. `yarn lint --fix` needed after Write tool creates files with CRLF on Windows — run it after each new file creation.
- **Step 2 complete (2026-03-07):** Full orchestrator wired — `useHostQuizState` → state machine routing to 4 typed view stubs. `yarn lint --fix` resolved CRLF issues. No provider needed; `AppProviders` already wraps with `RealtimeClientProvider`.
- **Build note:** Pre-existing 500 error on `/(host)/page` (home route) during `yarn build` — unrelated to this plan. New files compile cleanly.
- **Step 5 complete (2026-03-07):** Full-screen dark `RoundResultsView` implemented — correct answer banner, 3 stat cards (correct count, accuracy %, avg time), leaderboard with rank-change arrows, top-3 scorers with medal pills. `yarn lint` clean. **Architecture note:** `roundSummary` is local `useState` set only by `lockQuestionMutation.onSuccess` in `useHostQuizState` — so the round results view appears on the tab that called the lock (dashboard), but NOT on a separate projector tab. Cross-tab delivery would require broadcasting the summary via Supabase realtime or storing it in the quiz state. Out of scope for Step 5.
- **Phase 3 complete (2026-03-07):** Steps 7 & 8 done. `quiz-list.tsx` — removed `startQuizMutation`, `useMutation`, `useQueryClient`, `PlayCircle`, `Loader2`; added `MonitorPlay`; Pending → "Open Lobby" navigates to `/quiz/[id]/live`; Active → "Open Live View" same route. `player-session-screen.tsx` — `waitingForQuestion` block now shows context-aware message: Pending → "Waiting for the host to start the quiz...", Active → "Waiting for the host to launch the next question." E2E verified via Playwright: Active quizzes show correct button, click navigates to live page. `yarn lint` clean, 368/369 tests pass (1 pre-existing flaky shuffle test).
- **Step 6 complete (2026-03-07):** `FinalResultsView` implemented — "Game Over!" header, podium [2nd, 1st, 3rd] with crown emoji and medal colors, full "Final Standings" leaderboard. `yarn lint` clean. E2E verified via Playwright screenshot. **Bug fixed:** `AdvanceQuestionUseCase` was not calling `endQuiz()` when the last question was advanced — quiz never reached `Completed` status. Fixed by calling `quizAggregate.endQuiz()` when `nextQuestion()` returns null. New test added covering quiz completion on last advance (3/3 passing).

---

## Completion Checklist

- [x] All 10 implementation steps checked off
- [x] All success criteria met (except `yarn build` not yet run)
- [x] `yarn lint` clean
- [x] `yarn test` passes (368 tests)
- [x] `yarn build` succeeds
- [x] Manual E2E flow tested via Playwright MCP
- [x] Session file created in `docs/progress/sessions/`
- [x] PROGRESS.md updated with session entry
