# Create Use Case

Scaffold a new application use case with DTO, mapper, and tests.

## Usage
```
/create-use-case [verb-noun description]
```

Example: `/create-use-case archive-quiz` → creates `archive-quiz.use-case.ts`

## What Gets Created

1. `src/application/dtos/[entity].dto.ts` - Update or create DTO (if needed)
2. `src/application/use-cases/[verb-noun].use-case.ts` - Use case function
3. `src/tests/application/use-cases/[verb-noun].use-case.test.ts` - Tests

## Step 1: Read Related Code First

```bash
# Understand the domain entity being operated on
# e.g., src/domain/entities/quiz.ts

# Read an existing similar use case to match patterns
# e.g., src/application/use-cases/start-quiz.use-case.ts

# Read existing DTO to check if it needs extending
# e.g., src/application/dtos/quiz.dto.ts
```

## Step 2: Update/Create DTO

File: `src/application/dtos/[entity].dto.ts`

```typescript
import { z } from 'zod';

// Input schema (for API validation)
export const [VerbNoun]InputSchema = z.object({
  [entityId]: z.string().uuid(),
  // other input fields...
});
export type [VerbNoun]Input = z.infer<typeof [VerbNoun]InputSchema>;

// Output DTO (what the API returns)
export type [Entity]DTO = {
  id: string;
  // fields that presentation layer needs...
};

// Mapper: entity → DTO (no Prisma types here)
export function [entity]ToDTO(entity: [Entity]): [Entity]DTO {
  return {
    id: entity.id,
    // map fields...
  };
}
```

## Step 3: Create Use Case

File: `src/application/use-cases/[verb-noun].use-case.ts`

```typescript
import { I[Entity]Repository } from '@domain/repositories/I[Entity]Repository';
import { [VerbNoun]Input, [Entity]DTO, [entity]ToDTO } from '@application/dtos/[entity].dto';

type [VerbNoun]Error = 'NOT_FOUND' | 'INVALID_STATE' | 'VALIDATION_ERROR';

type [VerbNoun]Result =
  | { success: true; data: [Entity]DTO }
  | { success: false; error: [VerbNoun]Error };

export async function [verbNoun]UseCase(
  input: [VerbNoun]Input,
  [entity]Repo: I[Entity]Repository,
): Promise<[VerbNoun]Result> {
  const entity = await [entity]Repo.findById(input.[entityId]);
  if (!entity) return { success: false, error: 'NOT_FOUND' };

  try {
    entity.doSomething();
  } catch {
    return { success: false, error: 'INVALID_STATE' };
  }

  await [entity]Repo.save(entity);
  return { success: true, data: [entity]ToDTO(entity) };
}
```

## Step 4: Wire into Service (if needed)

File: `src/application/services/[entity].service.ts`

Add a method that calls the use case:
```typescript
async [verbNoun](input: [VerbNoun]Input): Promise<[VerbNoun]Result> {
  return [verbNoun]UseCase(input, this.[entity]Repository);
}
```

If `factories.ts` needs a new dependency, add it there.

## Step 5: Write Tests

File: `src/tests/application/use-cases/[verb-noun].use-case.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { [verbNoun]UseCase } from '@application/use-cases/[verb-noun].use-case';
import type { I[Entity]Repository } from '@domain/repositories/I[Entity]Repository';

const make[Entity] = () => new [Entity]({ id: 'entity-1', /* valid props */ });

describe('[verbNoun]UseCase', () => {
  let [entity]Repo: Mocked<I[Entity]Repository>;

  beforeEach(() => {
    [entity]Repo = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
  });

  it('should succeed and return DTO', async () => {
    [entity]Repo.findById.mockResolvedValue(make[Entity]());

    const result = await [verbNoun]UseCase({ [entityId]: 'entity-1' }, [entity]Repo);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('entity-1');
    }
    expect([entity]Repo.save).toHaveBeenCalledOnce();
  });

  it('should return NOT_FOUND when entity does not exist', async () => {
    [entity]Repo.findById.mockResolvedValue(null);

    const result = await [verbNoun]UseCase({ [entityId]: 'missing' }, [entity]Repo);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('NOT_FOUND');
    expect([entity]Repo.save).not.toHaveBeenCalled();
  });

  it('should return INVALID_STATE when entity rejects the command', async () => {
    const entity = make[Entity]();
    // put entity in wrong state
    [entity]Repo.findById.mockResolvedValue(entity);

    const result = await [verbNoun]UseCase({ [entityId]: 'entity-1' }, [entity]Repo);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('INVALID_STATE');
  });
});
```

## Step 6: Run Tests

```bash
yarn test src/tests/application/use-cases/[verb-noun].use-case.test.ts
```

Must pass before wiring up the API route.

## Step 7: Create API Route (optional)

File: `src/app/api/[entity]/[action]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServices } from '@application/services/factories';
import { [VerbNoun]InputSchema } from '@application/dtos/[entity].dto';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = [VerbNoun]InputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const services = getServices();
  const result = await services.[entity]Service.[verbNoun](parsed.data);

  if (!result.success) {
    const status = /not found/i.test(result.error) ? 404 : 422;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.data);
}
```

## Checklist

- [ ] DTO schema and mapper created/updated
- [ ] Use case function created with typed Result return
- [ ] Service method added (if applicable)
- [ ] Tests: success path, NOT_FOUND, INVALID_STATE
- [ ] `yarn test src/tests/application/` passes
- [ ] API route created (if exposing via HTTP)
