# R5 Phase 1: Configurable Speed-Based Scoring - Complete

**Date:** 2025-12-20
**Status:** ✅ Complete
**Branch:** feat/start-over

## Overview
Completed all 8 steps of R5 Phase 1, implementing configurable speed-based scoring system with three algorithms (exponential decay, linear decay, fixed points) and full admin UI integration.

## Goals Achieved
- ✅ Step 1-3: Domain scoring strategies fully implemented
- ✅ Step 4-6: DTOs, Prisma schema, and repositories updated
- ✅ Step 7: Admin UI with ScoringSettings component
- ✅ Step 8: Integration tests verifying all algorithms

## Key Work Completed

### Domain Implementation
1. **Scoring Strategies** ([src/domain/value-objects/scoring-strategy.ts](src/domain/value-objects/scoring-strategy.ts))
   - `ExponentialDecayStrategy`: Rewards speed exponentially (decayRate: 0.1-5.0)
   - `LinearDecayStrategy`: Guarantees 50% minimum points with linear speed bonus
   - `FixedPointsStrategy`: No speed adjustment (backward compatibility)
   - Factory method `createScoringStrategy()` for instantiation

2. **Quiz Entity Enhancement**
   - Added `getScoringStrategy()` method using settings
   - Quiz tracks `scoringAlgorithm` and `scoringDecayRate` in settings

3. **QuizSessionAggregate Update**
   - Fixed bug in [submitAnswer()](src/domain/aggregates/quiz-session-aggregate.ts#L140-L165): was passing remaining time instead of elapsed time to scoring strategies
   - Now calculates: `timeTaken = timePerQuestion - remainingTime`
   - Strategies receive correct elapsed time for point calculations

### Infrastructure & Data Layer
4. **Prisma Schema** ([prisma/schema.prisma](src/infrastructure/database/prisma/schema.prisma))
   - Added `scoring_algorithm` enum column (default: EXPONENTIAL_DECAY)
   - Added `scoring_decay_rate` float column (default: 2.0)
   - Migration applied successfully

5. **DTOs** ([src/application/dtos/quiz-admin.dto.ts](src/application/dtos/quiz-admin.dto.ts))
   - `CreateQuizDTO`: scoringAlgorithm (default EXPONENTIAL_DECAY), scoringDecayRate (default 2.0, range 0.1-5.0)
   - `UpdateQuizDTO`: Both fields optional
   - `QuizListItemDTO`: Both fields required for quiz listings

6. **Mappers**
   - [PrismaQuizRepository](src/infrastructure/repositories/prisma-quiz-repository.ts): Maps scoring fields to/from database
   - [ListAllQuizzesUseCase](src/application/use-cases/list-all-quizzes.use-case.ts): Includes scoring fields in DTO transformation

### Presentation Layer
7. **UI Components**
   - [Collapsible](src/components/ui/collapsible.tsx): Radix UI primitive for expandable sections
   - [Accordion](src/components/ui/accordion.tsx): Radix UI primitive with animations
   - [ScoringSettings](src/components/admin/scoring-settings.tsx): 200+ line reusable component with:
     - Preset selector (Default/Gentle/Aggressive/Fixed)
     - Custom decay rate input with validation
     - Live preview showing point calculations at 0s/3s/6s/9s
     - Help accordion explaining algorithms

8. **Admin Dialogs**
   - [CreateQuizDialog](src/components/admin/create-quiz-dialog.tsx): Integrated ScoringSettings component, includes scoring fields in mutation
   - [EditQuizDialog](src/components/admin/edit-quiz-dialog.tsx): Same integration, useEffect resets state on quiz/open change

### Testing
9. **Integration Tests** ([src/tests/integration/scoring-flow.test.ts](src/tests/integration/scoring-flow.test.ts))
   - 6 test scenarios covering all algorithms:
     - Exponential decay with default rate (2.0): [67, 36, 20, 13] points at [2s, 5s, 8s, 10s]
     - Exponential decay with gentle rate (0.5): [90, 77, 67, 60] points
     - Exponential decay with aggressive rate (4.0): [44, 13, 4, 1] points
     - Linear decay: [90, 75, 60, 50] points (50% minimum guarantee)
     - Fixed points: [100, 100, 100, 100] points (no time penalty)
     - Incorrect answers: [0, 0, 0, 0] points regardless of algorithm
   - Uses `vi.useFakeTimers()` and `vi.advanceTimersByTime()` for time simulation
   - All tests passing

## Test Results
**Final Status:** ✅ 193 tests passing | 1 skipped (194 total)
- All existing tests still passing (no regressions)
- All 6 new integration tests passing
- TypeScript compilation successful

## Key Bug Fixes
1. **ChevronDown Icon:** Changed from `@radix-ui/react-icons` to `lucide-react` (already installed)
2. **Aggregate Scoring Bug:** Fixed submitAnswer() to pass elapsed time instead of remaining time to scoring strategies
3. **Test Expectations:** Adjusted expected point values to match actual Math.floor() results from exponential decay formula

## Files Modified
- Domain: `quiz-session-aggregate.ts` (1 critical fix)
- DTOs: `quiz-admin.dto.ts` (3 schemas updated)
- Mappers: `list-all-quizzes.use-case.ts` (mapper includes scoring fields)
- Components: `create-quiz-dialog.tsx`, `edit-quiz-dialog.tsx` (scoring integration)
- Tests: `scoring-flow.test.ts` (new file, 178 lines)

## Next Steps (Phase 2)
1. Player UI displays scoring algorithm in quiz info
2. Player sees live point preview during countdown
3. Realtime leaderboard updates with animated score changes
4. Host dashboard shows scoring configuration per quiz

## Notes
- Scoring formulas are documented in-code with examples
- Admin UI provides presets for common use cases
- Live preview helps admins understand point distribution
- Backward compatibility maintained (FIXED algorithm)
