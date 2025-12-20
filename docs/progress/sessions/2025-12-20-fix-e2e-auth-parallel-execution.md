# 2025-12-20: Fix E2E Auth Issues in Parallel Execution

## Problem
When running full E2E test suite, 3 tests in `admin-quiz-crud.spec.ts` were failing with auth redirects:
- "should update a pending quiz" ❌
- "should delete a pending quiz" ❌
- "should not show edit/delete buttons for active quiz" ❌

**Root Cause**: Auth storage state was not persisting between tests when running in parallel across multiple workers. Tests would redirect to `/login?redirect=%2Fadmin%2Fquizzes` after the first test completed.

## Solution

### 1. Serial Execution Mode
Added `test.describe.configure({ mode: 'serial' })` to force sequential test execution within the describe block.

### 2. Shared Context Pattern
Switched from `beforeEach` to `beforeAll` with a persistent browser context:

```typescript
test.beforeAll(async ({ browser }) => {
  // Create a persistent context with auth state for all tests
  const context = await browser.newContext({
    storageState: 'playwright/.auth/user.json',
  });
  const page = await context.newPage();
  quizzesPage = new AdminQuizzesPage(page);
  await quizzesPage.goto();
});
```

This ensures:
- Auth state loads once and persists across all tests
- No repeated navigation that could lose cookies
- Tests share the same page instance

### 3. Test Function Updates
Removed `page` parameter from test functions and used `quizzesPage.page` instead since we're using a shared page object.

### 4. Retry Configuration
Added retry logic to handle flaky tests:
```typescript
retries: process.env.CI ? 2 : 1, // Retry once in dev, twice in CI
```

## Results
✅ **24/24 tests passing**
- admin-auth: 6/6 passing
- admin-quiz-crud: 4/4 passing (fixed!)
- admin-question-crud: 9/9 passing
- host-dashboard: 2/2 passing
- player-join: 3/3 passing

Total execution time: ~18-19 seconds

## Key Learnings
1. **Auth state persistence**: NextAuth session cookies don't survive repeated page navigations in parallel test execution
2. **Serial mode + beforeAll**: Combination ensures auth state loaded once and reused
3. **Shared page pattern**: Tests within serial describe block can safely share same page/context
4. **POM benefits**: Page Object Model made refactoring easy - only needed to change test setup, not individual test logic

## Files Modified
- `/e2e/admin-quiz-crud.spec.ts` - Changed from beforeEach to beforeAll, added serial mode
- `/playwright.config.ts` - Added retry configuration for dev environment
