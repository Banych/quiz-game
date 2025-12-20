# Session: Fix E2E Test Auth Conflicts (2025-12-20)

## Context
After successfully rewriting admin-question-crud tests (9/9 passing), ran full E2E suite and discovered 3/4 admin-quiz-crud tests failing. Tests worked fine in isolation but failed when run alongside other tests.

## Initial State
- **Test Results**: 21/24 passing (87.5%)
  - ✅ admin-auth: 6/6
  - ✅ admin-question-crud: 9/9 (newly rewritten)
  - ✅ host-dashboard: 2/2
  - ✅ player-join: 3/3
  - ❌ admin-quiz-crud: 1/4 (create passed, update/delete/active failed)

## Problem Analysis

### Root Cause Discovery
Failed tests showed redirect to login page instead of admin dashboard. Investigation revealed:

1. **Parallel Execution Conflict**: Tests use shared authenticated storage state (`playwright/.auth/user.json`)
2. **Cookie Clearing**: `admin-auth.spec.ts` called `page.context().clearCookies()` in `beforeEach`
3. **Race Condition**: When admin-auth and quiz-crud ran in parallel, cookie clearing invalidated auth for all tests sharing the context

### Key Finding
```typescript
// admin-auth.spec.ts - Line 8
test.beforeEach(async ({ page }) => {
  await page.context().clearCookies(); // ⚠️ Clears auth for ALL parallel tests!
});
```

## Solutions Attempted

### Attempt 1: Global Sequential Execution (FAILED)
**Change**: Set `workers: 1` in `playwright.config.ts`
**Result**: Catastrophic regression - 12/21 passing (50%)
- ✅ Quiz-crud improved: 0/4 → 1/4
- ❌ Question-crud regressed: 9/9 → 0/9 (all timeout at ~15.8s)
**Reason**: Sequential execution exposed different timing issues; tests that worked in parallel broke when forced sequential

### Attempt 2: Serial Mode in Quiz-Crud Only (PARTIAL)
**Change**: Added `test.describe.configure({ mode: 'serial' })` to admin-quiz-crud
**Result**: Mixed - 1/4 passing, 3 skipped
- Second test ("should update") failed with login redirect
- Serial mode stopped after first failure, skipping remaining tests
**Issue**: In serial mode, shared page/context between tests caused auth state corruption

### Attempt 3: Logout Button Wait (PARTIAL)
**Change**: Added wait for logout button in `beforeEach` to ensure client-side auth loaded
```typescript
await expect(page.getByRole('button', { name: /logout/i }))
  .toBeVisible({ timeout: 10000 });
```
**Result**: Helped but didn't solve root cause
**Issue**: Auth was still being cleared by parallel admin-auth tests

### Attempt 4: Isolated Auth Context (SUCCESS)
**Change**: Created separate unauthenticated context for admin-auth tests
```typescript
// admin-auth.spec.ts
const authTest = test.extend({
  storageState: { cookies: [], origins: [] },
});
```
**Result**: 21/24 passing - isolated auth tests from affecting others
**Remaining Issue**: 1 quiz-crud test still failing (serial mode issue)

### Attempt 5: Remove Serial Mode (FAILED)
**Change**: Removed `test.describe.configure({ mode: 'serial' })` from quiz-crud
**Result**: Regression - 20/24 passing (all 4 quiz-crud tests failing)
**Reason**: Parallel quiz-crud tests still conflicted with each other on same page

### Attempt 6: Shared Page in Serial Mode (INCOMPLETE)
**Change**: Serial mode with dedicated page instance
```typescript
test.describe.configure({ mode: 'serial' });

let sharedPage: any;

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    storageState: 'playwright/.auth/user.json',
  });
  sharedPage = await context.newPage();
});

test.beforeEach(async () => {
  await sharedPage.goto('http://localhost:3000/admin/quizzes');
  await expect(sharedPage.getByRole('button', { name: /logout/i }))
    .toBeVisible({ timeout: 10000 });
  await expect(sharedPage.getByRole('button', { name: /create quiz/i }))
    .toBeVisible({ timeout: 5000 });
});

test('should create', async () => {
  const page = sharedPage;
  // ... test code
});
```

**Result**: UNKNOWN - still seeing failures when running full test suite
**Status**: ⚠️ INCOMPLETE - tests pass in isolation but still fail when run together

## Current State (UNRESOLVED)
- **Status**: ❌ Auth conflicts NOT fully resolved
- **Issue**: Tests still fail when running full suite
- **Working**: Tests pass in isolation
- **Not Working**: Full test suite execution still has conflicts

### Test Results (Incomplete)
  - ✅ admin-auth: 6/6 (isolated context)
  - ❓ admin-question-crud: Status unknown in full suite
  - ❓ admin-quiz-crud: Status unknown in full suite
  - ✅ host-dashboard: 2/2 (likely passing)
  - ✅ player-join: 3/3 (likely passing)

## Key Learnings

### Auth Isolation Pattern
**Problem**: Tests that manipulate auth (login/logout/clearCookies) affect parallel tests using shared storage state

**Solution**: Isolate auth tests with empty storage state:
```typescript
const authTest = test.extend({
  storageState: { cookies: [], origins: [] },
});
```

### Serial Mode with Shared Page
**Problem**: Serial mode tests sharing page fixture caused auth corruption between tests

**Solution**: Create dedicated page in `beforeAll`, reuse across serial tests:
- Eliminates parallel conflicts (tests don't run simultaneously)
- Maintains auth state between tests (same page instance)
- Properly resets page state via `beforeEach` navigation

### Parallel vs Sequential Trade-offs
- **Parallel**: Faster, but requires careful auth isolation
- **Sequential (workers: 1)**: Simple but can expose hidden timing bugs
- **Serial (describe.configure)**: Best for tests manipulating same resources

### Client-Side Auth Race Condition
**Issue**: Admin layout uses client-side `useEffect` for auth check, creating race between page load and auth verification

**Fix**: Wait for logout button visibility as signal that auth completed:
```typescript
await expect(page.getByRole('button', { name: /logout/i }))
  .toBeVisible({ timeout: 10000 });
```

## Code Changes

### Files Modified
1. **playwright.config.ts**
   - Reverted `workers: 1` → `workers: process.env.CI ? 1 : undefined`
   - Parallel execution in dev, sequential in CI

2. **e2e/admin-auth.spec.ts**
   - Created isolated `authTest` fixture with empty storage state
   - Removed `page.context().clearCookies()` from `beforeEach`
   - Changed all `test(...)` to `authTest(...)`

3. **e2e/admin-quiz-crud.spec.ts**
   - Added serial mode: `test.describe.configure({ mode: 'serial' })`
   - Created shared page in `beforeAll` with auth storage state
   - Updated all tests to use `sharedPage` instead of fixture `page`
   - Enhanced `beforeEach` with logout button and create button waits

## Testing Guidelines

### When to Use Serial Mode
✅ Tests manipulating same page/resource (e.g., quiz list CRUD)
✅ Tests with interdependencies or state accumulation
❌ Independent tests that don't share resources

### When to Isolate Storage State
✅ Tests that clear cookies or manipulate auth
✅ Tests that need unauthenticated state
❌ Tests that rely on pre-existing auth

### Best Practices
1. **Prefer parallel execution** for speed
2. **Isolate side effects** (auth changes, cookie clearing)
3. **Wait for auth signals** (logout button visibility)
4. **Use shared page in serial mode** to maintain state
5. **Test in isolation first** before running full suite

## Next Steps (TO BE CONTINUED)
- ❌ E2E tests NOT fully resolved - still failing in full suite
- ⚠️ Need to investigate why shared page approach doesn't work
- 🔍 Possible issues:
  - Shared page instance may not properly isolate between tests
  - Auth state corruption still happening in full suite
  - Race conditions between parallel files and serial tests
  - Storage state file may be getting corrupted/shared incorrectly
- 📋 Alternative approaches to explore:
  - Multiple admin user accounts (admin1@test.com, admin2@test.com, etc.)
  - Per-worker storage state files
  - Complete test isolation with fresh contexts per test
  - Database cleanup between test files

## Outstanding Issues
1. **Full suite failures**: Tests pass individually but fail when run together
2. **Root cause unclear**: Shared page approach didn't resolve the conflicts
3. **Auth isolation incomplete**: Current isolation pattern insufficient for all scenarios

## Metrics
- **Session Duration**: ~2 hours
- **Iterations**: 6 attempts (none fully successful)
- **Current Status**: ⚠️ UNRESOLVED
- **Test Execution Time**: ~23 seconds (parallel) when working
- **Files Modified**: 3 (playwright.config.ts, admin-auth.spec.ts, admin-quiz-crud.spec.ts)

---

**Session Status**: ⚠️ INCOMPLETE - Auth conflicts partially mitigated but not fully resolved. Full test suite still experiencing failures. Investigation to be continued.
