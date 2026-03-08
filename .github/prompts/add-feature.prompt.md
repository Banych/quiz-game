---
agent: 'agent'
description: 'Guide for implementing a new feature end-to-end following DDD-lite architecture with mandatory test gates at each layer.'
tools: ['search/codebase', 'edit/editFiles', 'read/terminalLastCommand', 'supabase/*', 'playwright/*', 'context7/*']
---

# Add Feature Workflow

Guide for implementing new features following DDD-lite architecture.

## Usage
```
#add-feature [feature description]
```

## Workflow Steps

### 1. Domain Layer (`src/domain/`)
First, implement the core business logic:

**Entity changes** (`src/domain/entities/`):
- Add new properties with private access
- Create command methods (mutating) and query methods (read-only)
- Enforce invariants in constructor/methods
- Emit domain events for state changes

**Value objects** (`src/domain/value-objects/`):
- Create immutable objects for domain concepts
- Self-validate in constructor

**Repository interface** (`src/domain/repositories/`):
- Define async methods returning domain entities
- No Prisma types - keep framework-agnostic

**Tests** (BEFORE moving to next layer):
- Create `src/tests/domain/entities/` or `src/tests/domain/aggregates/` tests
- Cover: creation, invariants, commands, events, error cases
- Run: `yarn test src/tests/domain/`

### 2. Application Layer (`src/application/`)

**DTO** (`src/application/dtos/`):
- Define zod schema for API input/output
- Create mapper function: entity → DTO

**Use Case** (`src/application/use-cases/`):
- File naming: `kebab-case.use-case.ts`
- Pattern:
```typescript
export async function myFeatureUseCase(
  input: MyInput,
  quizRepo: IQuizRepository
): Promise<Result<MyDTO, MyError>> {
  const entity = await quizRepo.findEntityById(input.id);
  if (!entity) return { success: false, error: 'NOT_FOUND' };
  entity.doSomething();
  await quizRepo.save(entity);
  return { success: true, data: entityToDTO(entity) };
}
```

**Service** (`src/application/services/`):
- Add method to appropriate service (QuizService, PlayerService, AnswerService)
- Wire in `factories.ts` if new dependencies needed

**Tests** (BEFORE moving to next layer):
- Create `src/tests/application/use-cases/` tests
- Mock repositories, test: success path, NOT_FOUND, validation errors
- Run: `yarn test src/tests/application/`

### 3. Infrastructure Layer (`src/infrastructure/`)

**Prisma schema** (`src/infrastructure/database/prisma/schema.prisma`):
- Add/modify models
- Run: `yarn prisma:migrate -- --name describe_change`
- Run: `yarn prisma:generate`

**Repository implementation** (`src/infrastructure/repositories/`):
- Implement domain interface
- Map Prisma types ↔ domain entities
- Handle normalized DB rows → aggregate reconstruction

**Tests** (BEFORE moving to next layer):
- Create `src/tests/infrastructure/repositories/` tests
- Use `resetServices({ force: true })` for test isolation
- Test: save, find, update, delete, edge cases
- Run: `yarn test src/tests/infrastructure/`

### 4. Presentation Layer

**API Route** (`src/app/api/`):
- Validate input with zod
- Call `getServices()` from factories
- Return JSON DTO
- Map errors: `/not found/i` → 404

**Hook** (`src/hooks/`):
- Wrap TanStack Query
- Handle cache updates for realtime

**Component** (`src/components/`):
- Receive DTOs as props only
- Never import entities or Prisma types

## Checklist (Complete each section before moving on)

**Layer 1: Domain**
- [ ] Entity/aggregate behavior implemented
- [ ] Domain tests written and passing: `yarn test src/tests/domain/`

**Layer 2: Application**
- [ ] DTO schema created
- [ ] Use case implemented
- [ ] Use case tests written and passing: `yarn test src/tests/application/`

**Layer 3: Infrastructure**
- [ ] Prisma schema updated (if needed) + `yarn prisma:generate`
- [ ] Repository implementation updated
- [ ] Repository tests written and passing: `yarn test src/tests/infrastructure/`

**Layer 4: Presentation**
- [ ] API route created
- [ ] Hook created
- [ ] Component updated

**Final Verification**
- [ ] All tests passing: `yarn test`
- [ ] Build succeeds: `yarn build`
