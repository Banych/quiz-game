# Create Domain Entity

Scaffold a new domain entity following project conventions.

## Usage
```
/create-entity [EntityName]
```

Example: `/create-entity Category`

## What Gets Created

1. `src/domain/entities/[entity-name].ts` - Entity class
2. `src/tests/domain/entities/[entity-name].test.ts` - Test skeleton

## Step 1: Read Existing Entities First

Before writing anything, read an existing entity to match conventions:
```
src/domain/entities/quiz.ts
src/domain/entities/player.ts
```

Pay attention to: constructor signature, private fields, command methods, domain events.

## Step 2: Create Entity File

File: `src/domain/entities/[entity-name].ts`

```typescript
import { DomainEvent } from '@domain/events/domain-event';

export interface [EntityName]Props {
  id: string;
  // ... required fields
  createdAt?: Date;
}

export class [EntityName] {
  private readonly _id: string;
  // ... private fields
  private _domainEvents: DomainEvent[] = [];

  constructor(props: [EntityName]Props) {
    // Validate invariants here
    if (!props.id) throw new Error('[EntityName] id is required');

    this._id = props.id;
    // ... assign fields
  }

  // --- Queries (read-only) ---
  get id(): string { return this._id; }
  // ... other getters

  // --- Commands (mutating, emit events) ---
  doSomething(): void {
    // Enforce invariants
    // Mutate state
    // Emit event
    this._domainEvents.push({ eventType: '[entity].something-happened', payload: { id: this._id } });
  }

  // --- Domain events ---
  getDomainEvents(): DomainEvent[] { return [...this._domainEvents]; }
  clearDomainEvents(): void { this._domainEvents = []; }
}
```

## Step 3: Add Repository Interface

File: `src/domain/repositories/I[EntityName]Repository.ts`

```typescript
import { [EntityName] } from '@domain/entities/[entity-name]';

export interface I[EntityName]Repository {
  findById(id: string): Promise<[EntityName] | null>;
  save(entity: [EntityName]): Promise<void>;
  delete(id: string): Promise<void>;
}
```

## Step 4: Write Tests

File: `src/tests/domain/entities/[entity-name].test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { [EntityName] } from '@domain/entities/[entity-name]';

const makeValid[EntityName] = (overrides = {}): [EntityName] =>
  new [EntityName]({ id: 'test-id', /* required fields */, ...overrides });

describe('[EntityName]', () => {
  describe('creation', () => {
    it('should create with valid props', () => {
      const entity = makeValid[EntityName]();
      expect(entity.id).toBe('test-id');
    });

    it('should throw when id is missing', () => {
      expect(() => new [EntityName]({ id: '', /* ... */ })).toThrow();
    });

    // Add invariant tests for each validation rule
  });

  describe('[command method]', () => {
    it('should [expected outcome]', () => {
      const entity = makeValid[EntityName]();
      entity.doSomething();
      // assert state change
    });

    it('should emit [Event] when [action]', () => {
      const entity = makeValid[EntityName]();
      entity.doSomething();
      expect(entity.getDomainEvents()).toContainEqual(
        expect.objectContaining({ eventType: '[entity].something-happened' })
      );
    });

    it('should throw when in invalid state', () => {
      const entity = makeValid[EntityName]();
      // put entity in wrong state
      expect(() => entity.doSomething()).toThrow();
    });
  });
});
```

## Step 5: Run Tests

```bash
yarn test src/tests/domain/entities/[entity-name].test.ts
```

Tests must pass before proceeding to Application layer.

## Checklist

- [ ] Entity class created with private fields and getters
- [ ] Invariants validated in constructor and command methods
- [ ] Domain events emitted on state changes
- [ ] Repository interface defined
- [ ] Tests written: creation, invariants, commands, events, error cases
- [ ] `yarn test src/tests/domain/` passes
