# R5 Phase 3: Round Transitions & Answer Locking - Implementation Plan

**Date:** 2026-01-24
**Status:** ✅ Phase 3 Complete | All 11 Steps Done
**Branch:** feat/start-over
**Previous:** R5 Phase 1 (Scoring ✅), Phase 2 (UI Enhancements ✅)

## Progress
- ✅ Step 1: Database schema updates (migration applied, Prisma client regenerated)
- ✅ Step 2: Domain layer - question locking methods (lockCurrentQuestion, isQuestionLocked, Question.answersLockedAt)
- ✅ Step 3: DTOs for round summaries (RoundSummaryDTO, PlayerResult, LeaderboardDelta)
- ✅ Step 4: Use cases (LockQuestionUseCase with proper type safety, ILeaderboardSnapshotRepository interface)
- ✅ Step 5: Repository implementation (PrismaLeaderboardSnapshotRepository, wired in factories.ts)
- ✅ Step 6: API routes (POST /api/quiz/[quizId]/lock-question)
- ✅ Step 7: Realtime broadcasting (broadcastRoundSummary on `question:locked` event)
- ✅ Step 8: Host UI - Lock Question button + Round Summary dialog
- ✅ Step 9: Host Hooks - lockQuestion mutation, roundSummary state
- ✅ Step 10: Player UI - AnswersLockedIndicator + useRoundSummaryListener hook
- ✅ Step 11: E2E tests for round transitions (e2e/round-transitions.spec.ts)

## Context
We're now in R5 Phase 3, implementing round transitions with answer locking, round summaries, and leaderboard snapshots. This enables proper quiz flow control and post-question analytics.

## Prerequisites (Completed)
- ✅ R5 Phase 1: Speed-based scoring strategies (exponential/linear/fixed)
- ✅ R5 Phase 2: Player UI with live point previews and speed indicators
- ✅ Database seeded with demo quiz
- ✅ Host and player E2E tests passing

## Phase 3 Goals
1. **Answer Locking**: Prevent late submissions after host locks question
2. **Round Summaries**: Show results after each question (correct answer, player performance)
3. **Leaderboard Snapshots**: Historical tracking for analytics and replay
4. **Host Controls**: UI for locking questions and viewing summaries

## Implementation Steps

### Step 1: Database Schema Updates (~30 min)
Add answer locking and leaderboard snapshot tables.

**File:** `src/infrastructure/database/prisma/schema.prisma`

```prisma
model Question {
  // ... existing fields ...
  answersLockedAt DateTime?
}

model LeaderboardSnapshot {
  id             String   @id @default(cuid())
  quizId         String
  questionIndex  Int
  playerId       String
  score          Int
  rank           Int
  capturedAt     DateTime @default(now())

  quiz   Quiz   @relation(fields: [quizId], references: [id], onDelete: Cascade)
  player Player @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@index([quizId, questionIndex])
  @@index([playerId])
  @@map("leaderboard_snapshots")
}
```

**Migration:** `yarn prisma:migrate dev --name add-answer-locking-and-snapshots`

### Step 2: Domain Layer - Question Locking (~45 min)

**File:** `src/domain/aggregates/quiz-session-aggregate.ts`

Add methods:
```typescript
lockCurrentQuestion(): void {
  const question = this.getCurrentQuestion();
  if (!question) throw new Error('No active question to lock');
  if (question.answersLockedAt) throw new Error('Question already locked');

  question.answersLockedAt = new Date();
}

isQuestionLocked(): boolean {
  const question = this.getCurrentQuestion();
  return !!question?.answersLockedAt;
}
```

**File:** `src/domain/events/question-locked.event.ts` (NEW)
```typescript
export class QuestionLockedEvent {
  constructor(
    public readonly quizId: string,
    public readonly questionId: string,
    public readonly questionIndex: number,
    public readonly lockedAt: Date = new Date()
  ) {}
}
```

### Step 3: DTOs for Round Summaries (~30 min)

**File:** `src/application/dtos/round-summary.dto.ts` (NEW)

```typescript
export const PlayerResultSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  answerSubmitted: z.boolean(),
  correct: z.boolean(),
  timeTaken: z.number().nullable(),
  pointsEarned: z.number(),
});

export const LeaderboardDeltaSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  previousRank: z.number().nullable(),
  currentRank: z.number(),
  rankChange: z.number(), // positive = moved up, negative = moved down
});

export const RoundSummarySchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  correctAnswer: z.string(),
  questionIndex: z.number(),
  playerResults: z.array(PlayerResultSchema),
  averageTime: z.number().nullable(),
  correctCount: z.number(),
  totalPlayers: z.number(),
  leaderboardDeltas: z.array(LeaderboardDeltaSchema),
  lockedAt: z.string().datetime(),
});

export type RoundSummaryDTO = z.infer<typeof RoundSummarySchema>;
```

### Step 4: Use Cases (~1 hour)

**File:** `src/application/use-cases/lock-question.use-case.ts` (NEW)

```typescript
export class LockQuestionUseCase {
  constructor(
    private quizRepo: IQuizRepository,
    private playerRepo: IPlayerRepository,
    private snapshotRepo: ILeaderboardSnapshotRepository // new interface
  ) {}

  async execute(quizId: string): Promise<RoundSummaryDTO> {
    // 1. Load quiz and lock current question
    const quiz = await this.quizRepo.findById(quizId);
    if (!quiz) throw new Error('Quiz not found');

    quiz.lockCurrentQuestion();

    // 2. Calculate leaderboard and detect rank changes
    const currentLeaderboard = quiz.getLeaderboard();
    const previousSnapshots = await this.snapshotRepo.findByQuizAndQuestion(
      quizId,
      quiz.currentQuestionIndex - 1
    );

    // 3. Save new snapshots
    await this.snapshotRepo.saveSnapshots(
      quizId,
      quiz.currentQuestionIndex,
      currentLeaderboard
    );

    // 4. Build round summary DTO
    const summary = this.buildRoundSummary(quiz, currentLeaderboard, previousSnapshots);

    // 5. Persist locked state
    await this.quizRepo.save(quiz);

    return summary;
  }

  private buildRoundSummary(...): RoundSummaryDTO {
    // Map answers, calculate deltas, etc.
  }
}
```

**File:** `src/domain/repositories/leaderboard-snapshot-repository.ts` (NEW)

```typescript
export interface ILeaderboardSnapshotRepository {
  saveSnapshots(
    quizId: string,
    questionIndex: number,
    entries: LeaderboardEntry[]
  ): Promise<void>;

  findByQuizAndQuestion(
    quizId: string,
    questionIndex: number
  ): Promise<LeaderboardEntry[]>;
}
```

### Step 5: Infrastructure - Repository (~45 min)

**File:** `src/infrastructure/repositories/prisma-leaderboard-snapshot-repository.ts` (NEW)

Implement Prisma-backed repository for leaderboard snapshots.

### Step 6: API Routes (~45 min)

**File:** `src/app/api/quiz/[quizId]/question/lock/route.ts` (NEW)

```typescript
export async function POST(request: Request, { params }: RouteContext) {
  const { quizId } = await params;
  const { lockQuestionUseCase } = getServices();

  try {
    const roundSummary = await lockQuestionUseCase.execute(quizId);

    // Broadcast to all players
    await broadcastRoundSummary(quizId, roundSummary);

    return NextResponse.json({ roundSummary });
  } catch (error) {
    // Handle errors
  }
}
```

**Update:** `src/app/api/player/answer/route.ts`

Add answer locking check:
```typescript
const quiz = await quizRepository.findById(quizId);
if (quiz?.isQuestionLocked()) {
  return NextResponse.json(
    { error: 'Answers are locked for this question. Too late!' },
    { status: 403 }
  );
}
```

### Step 7: Realtime Broadcasting (~30 min)

**File:** `src/infrastructure/realtime/broadcast-round-events.ts` (NEW)

```typescript
export async function broadcastRoundSummary(
  quizId: string,
  roundSummary: RoundSummaryDTO
): Promise<void> {
  const client = getSupabaseServerClient();
  if (!client) return;

  const channel = client.channel(`quiz:${quizId}`);
  await channel.subscribe();

  await channel.send({
    type: 'broadcast',
    event: 'round:summary',
    payload: roundSummary,
  });

  await channel.unsubscribe();
}
```

### Step 8: Host UI Components (~2 hours)

**File:** `src/components/host/round-summary-dialog.tsx` (NEW)

Modal showing:
- Question text + correct answer
- Table of player results (name, answer, time, points)
- Leaderboard with rank changes (↑/↓/↔ indicators)
- Average time and accuracy stats

**File:** `src/components/host/host-quiz-dashboard.tsx`

Add "Lock Question" button to controls section:
```tsx
<Button
  variant="destructive"
  disabled={!canLockQuestion || isLockingQuestion}
  onClick={() => lockQuestion()}
>
  {isLockingQuestion ? 'Locking...' : 'Lock Question'}
</Button>
```

### Step 9: Host Hooks (~45 min)

**File:** `src/hooks/use-host-quiz-state.ts`

Add mutation:
```typescript
const lockQuestionMutation = useMutation({
  mutationFn: () => postQuizState<RoundSummaryDTO>(`/api/quiz/${quizId}/question/lock`),
  onSuccess: (roundSummary) => {
    // Show round summary dialog
    setRoundSummary(roundSummary);
    setShowSummaryDialog(true);

    // Refresh quiz state
    queryClient.invalidateQueries({ queryKey: hostQuizQueryKey(quizId) });
  },
});
```

Subscribe to round summary events:
```typescript
useEffect(() => {
  const unsubscribe = realtimeClient.subscribe<RoundSummaryDTO>(
    channelName,
    'round:summary',
    (summary) => {
      setRoundSummary(summary);
      setShowSummaryDialog(true);
    }
  );

  return unsubscribe;
}, [channelName, realtimeClient]);
```

### Step 10: Player UI Updates (~1 hour)

**File:** `src/components/player/round-summary-screen.tsx` (NEW)

Player-friendly summary view:
- Your answer vs. correct answer
- Points earned + speed indicator
- Your rank and rank change
- Top 5 leaderboard preview

**File:** `src/hooks/use-player-session.ts`

Subscribe to round summary:
```typescript
useEffect(() => {
  const unsubscribe = realtimeClient.subscribe<RoundSummaryDTO>(
    channelName,
    'round:summary',
    (summary) => {
      setRoundSummary(summary);
      setShowSummaryScreen(true);
    }
  );

  return unsubscribe;
}, [channelName, realtimeClient]);
```

### Step 11: Testing (~2 hours)

**Unit Tests:**
- `src/tests/domain/aggregates/quiz-session-aggregate.test.ts`: Add tests for `lockCurrentQuestion()` and `isQuestionLocked()`
- `src/tests/application/use-cases/lock-question.use-case.test.ts`: Mock repos and verify DTO output

**Integration Test:**
- `src/tests/integration/answer-locking-flow.test.ts`: Submit answer → lock question → attempt late answer → verify 403

**E2E Test:**
- `e2e/round-transitions.spec.ts`: Full flow from join → answer → lock → summary → next question

## Success Criteria
- ✅ Players can't submit answers after host locks question (403 error)
- ✅ Round summary shows after locking with correct stats
- ✅ Leaderboard snapshots persist to database
- ✅ Host can view round summary dialog with all details
- ✅ Players see simplified summary with their results
- ✅ Rank changes calculated and displayed correctly
- ✅ All tests passing (unit + integration + E2E)

## Estimated Time
- Schema + migrations: 30 min
- Domain layer: 45 min
- DTOs: 30 min
- Use cases: 1 hour
- Repository: 45 min
- API routes: 45 min
- Realtime: 30 min
- Host UI: 2 hours
- Host hooks: 45 min
- Player UI: 1 hour
- Testing: 2 hours

**Total: ~11 hours (1.5-2 days)**

## Follow-up (Phase 4)

---

## Implementation Notes

### Step 7 Completion (2026-01-24 14:30)
**Status:** ✅ Complete

**Files Created:**
- [src/infrastructure/realtime/broadcast-round-summary.ts](c:/Users/banyk/repos/quiz-game-1/src/infrastructure/realtime/broadcast-round-summary.ts) - Broadcasts `question:locked` event with RoundSummaryDTO payload

**Files Modified:**
- [src/app/api/quiz/[quizId]/lock-question/route.ts](c:/Users/banyk/repos/quiz-game-1/src/app/api/quiz/[quizId]/lock-question/route.ts) - Added `broadcastRoundSummary()` call after locking

**Validation:**
- Answer locking already enforced in [QuizSessionAggregate.submitAnswer()](c:/Users/banyk/repos/quiz-game-1/src/domain/aggregates/quiz-session-aggregate.ts#L156-L158) - throws "Answers are locked for this question" error
- All 211 tests still passing

**Realtime Event:**
- Channel: `quiz:{quizId}`
- Event: `question:locked`
- Payload: Full RoundSummaryDTO (questionId, correctAnswer, playerResults, leaderboardDeltas, averageTime, etc.)

**Next:** Step 8 - Host UI components for lock button and round summary dialog
After Phase 3 is complete, move to connection health and reconnection flows per action plan.

---

### Phase 3 Completion (2026-01-25)
**Status:** ✅ All Steps Complete

**Summary:**
R5 Phase 3 (Round Transitions & Answer Locking) is now complete. All 11 steps implemented:

1. Database schema with LeaderboardSnapshot table
2. Domain layer locking methods
3. RoundSummaryDTO with player results and leaderboard deltas
4. LockQuestionUseCase orchestrating the flow
5. PrismaLeaderboardSnapshotRepository for persistence
6. API route POST /api/quiz/[quizId]/lock-question
7. Realtime broadcasting on `question:locked` event
8. Host UI - Lock Question button + Round Summary dialog
9. Host Hooks - lockQuestion mutation with roundSummary state
10. Player UI - AnswersLockedIndicator + useRoundSummaryListener hook
11. E2E tests in e2e/round-transitions.spec.ts

**Test Results:**
- 214 unit/integration tests passing
- Build successful
- ESLint clean (except pre-existing admin layout warning)

**Files Created This Session:**
- `e2e/round-transitions.spec.ts` - E2E test for lock question flow

**Next Phase:**
- Connection health and reconnection flows
- Or proceed with Phase 4 per action plan
