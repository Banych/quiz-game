---
agent: 'agent'
description: 'Run and write tests following the project''s mandatory testing requirements. Covers Vitest unit/integration tests and Playwright E2E tests.'
tools: ['search/codebase', 'edit/editFiles', 'read/terminalLastCommand']
---

# Test Workflow

Run and write tests following the project's mandatory testing requirements.

## Usage
```
#test [optional: specific file or pattern]
```

## Core Principle: Test WHILE Implementing

**Tests are NOT optional.** From the project guidelines:
> When you skip tests, you break the development flow. Tests catch integration issues immediately and serve as living documentation.

## Test Commands

```bash
# Run all tests
yarn test

# Run specific test file
yarn test src/tests/domain/entities/quiz.test.ts

# Run tests matching pattern
yarn test submit-answer

# Watch mode (TDD)
yarn test:watch

# With coverage
yarn test:coverage

# E2E tests
yarn test:e2e
yarn test:e2e:ui    # Interactive UI
yarn test:e2e:debug # Debug mode
```

## Test File Locations

| Layer | Test Location | What to Test |
|-------|---------------|--------------|
| Domain | `src/tests/domain/entities/` | Entity behavior, invariants |
| Domain | `src/tests/domain/value-objects/` | Value object validation, equality |
| Domain | `src/tests/domain/aggregates/` | Aggregate coordination, events |
| Application | `src/tests/application/use-cases/` | Use case success + error paths |
| Infrastructure | `src/tests/infrastructure/repositories/` | CRUD operations, edge cases |
| Integration | `src/tests/integration/` | Cross-layer flows |
| E2E | `e2e/` or `tests/` | User flows via Playwright |

## Minimum Test Coverage Per Feature

### Domain Entity/Aggregate
```typescript
describe('MyEntity', () => {
  it('should create with valid input');
  it('should throw on invalid input');
  it('should [command] successfully');
  it('should emit [Event] when [action]');
  it('should throw when [invalid state transition]');
});
```

### Use Case
```typescript
describe('myFeatureUseCase', () => {
  it('should succeed with valid input');
  it('should return NOT_FOUND when entity missing');
  it('should return VALIDATION_ERROR on invalid input');
  it('should [specific business rule]');
});
```

### Repository
```typescript
describe('PrismaMyRepository', () => {
  it('should save and retrieve entity');
  it('should return null when not found');
  it('should update existing entity');
  it('should delete entity');
  it('should handle [edge case]');
});
```

## Test Patterns

### Mocking Repositories (Use Cases)
```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockQuizRepo = {
  findEntityById: vi.fn(),
  save: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

it('should return NOT_FOUND when quiz missing', async () => {
  mockQuizRepo.findEntityById.mockResolvedValue(null);

  const result = await myUseCase({ quizId: 'missing' }, mockQuizRepo);

  expect(result.success).toBe(false);
  expect(result.error).toBe('NOT_FOUND');
});
```

### Test DB Reset (Infrastructure)
```typescript
import { resetServices } from '@application/services/factories';

beforeEach(async () => {
  await resetServices({ force: true });
});
```

### Domain Entity Tests (No Mocks)
```typescript
it('should start quiz with questions', () => {
  const quiz = new Quiz('q1', 'Test Quiz');
  quiz.addQuestion(createTestQuestion());

  quiz.start();

  expect(quiz.getStatus()).toBe('Active');
  expect(quiz.getDomainEvents()).toContainEqual(
    expect.objectContaining({ eventType: 'quiz.started' })
  );
});
```

## Before Moving to Next Task

**Checklist:**
- [ ] All new code has corresponding tests
- [ ] Tests cover happy path
- [ ] Tests cover error cases
- [ ] Tests cover edge cases
- [ ] `yarn test` passes
- [ ] No skipped tests (`.skip`) left behind

## TDD Workflow (Recommended)

1. Write failing test for expected behavior
2. Implement minimum code to pass
3. Refactor while keeping tests green
4. Commit

```bash
# Start watch mode
yarn test:watch

# Write test → see it fail → implement → see it pass → refactor
```
