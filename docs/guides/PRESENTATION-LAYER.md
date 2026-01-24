# Guide: Presentation Layer (Routes, Hooks & Components)

This guide covers how to build Next.js routes, TanStack Query hooks, and React components. The presentation layer consumes DTOs (never entities or Prisma types) and provides the user interface.

## Overview

The presentation layer has three main responsibilities:

1. **API Routes** (`src/app/api/**`): REST endpoints that validate DTOs, call application services
2. **Hooks** (`src/hooks/**`): TanStack Query wrappers around API calls, realtime cache sync
3. **Components** (`src/components/**`, `src/app/**`): React UI consuming hooks and DTOs

**Key rule**: Components receive DTOs as props, never domain entities or Prisma types.

---

## API Routes

### Pattern

```typescript
// src/app/api/quiz/[quizId]/start/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServices } from '@application/services/factories';

// Input validation schema
const StartQuizInput = z.object({
  quizId: z.string().uuid(),
  hostId: z.string().uuid(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    // 1. Parse params (async in Next.js 15)
    const { quizId } = await params;

    // 2. Parse body
    const body = await req.json();
    const input = StartQuizInput.parse({ quizId, hostId: body.hostId });

    // 3. Call service
    const services = getServices();
    const result = await services.quizService.startQuiz(input.quizId);

    // 4. Return DTO
    return NextResponse.json(result);
  } catch (err) {
    // 5. Handle errors
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', issues: err.issues }, { status: 400 });
    }
    if (err instanceof QuizNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Key Patterns

1. **Await params**: Next.js 15 params are async
2. **Validate with zod**: Parse request body before calling services
3. **Call services**: Use `getServices()` to access application layer
4. **Return DTOs**: Always return structured JSON (DTOs from application layer)
5. **Map errors**: Domain errors → HTTP status codes (404, 400, 403)
6. **Error handling**: Separate branches for validation vs. business logic errors

### Error Mapping

```typescript
function mapErrorToStatus(err: unknown): number {
  if (err instanceof QuizNotFoundError) return 404;
  if (err instanceof InvalidStateError) return 400;
  if (err instanceof UnauthorizedError) return 403;
  if (err instanceof z.ZodError) return 400;
  return 500;
}
```

---

## TanStack Query Hooks

Hooks manage server state via TanStack Query and provide optimistic updates for mutations.

### Query Hook Pattern

```typescript
// src/hooks/use-quiz-state.ts

import { useQuery } from '@tanstack/react-query';
import type { QuizDTO } from '@application/dtos/quiz.dto';

const QUIZ_QUERY_KEY = (quizId: string) => ['quiz', quizId];

export function useQuizState(quizId: string) {
  return useQuery({
    queryKey: QUIZ_QUERY_KEY(quizId),
    queryFn: async () => {
      const res = await fetch(`/api/quiz/${quizId}/state`);
      if (!res.ok) throw new Error(`Failed to fetch quiz: ${res.statusText}`);
      return res.json() as Promise<QuizDTO>;
    },
    refetchInterval: false, // Rely on realtime only
    staleTime: Infinity, // Don't refetch unless manually triggered
  });
}
```

### Mutation Hook Pattern

```typescript
// src/hooks/use-submit-answer.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SubmitAnswerInput } from '@application/dtos/answer.dto';

export function useSubmitAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitAnswerInput) => {
      const res = await fetch('/api/player/answer', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`Failed to submit answer`);
      return res.json();
    },
    onSuccess: (data, variables) => {
      // Update cached quiz state with new answer
      const quizQueryKey = ['quiz', variables.quizId];
      queryClient.invalidateQueries({ queryKey: quizQueryKey });
    },
    onError: (err) => {
      console.error('Answer submission failed:', err);
    },
  });
}
```

### Realtime Hook Pattern

```typescript
// src/hooks/use-realtime-quiz.ts

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeClient } from './use-realtime-client';
import type { QuizDTO } from '@application/dtos/quiz.dto';

export function useRealtimeQuiz(quizId: string) {
  const queryClient = useQueryClient();
  const realtime = useRealtimeClient();

  useEffect(() => {
    if (!realtime) return;

    // Subscribe to quiz updates
    const unsubscribe = realtime.subscribe(`quiz:${quizId}`, (event: QuizDTO) => {
      // Push realtime event into Query cache
      queryClient.setQueryData(['quiz', quizId], event);
    });

    return unsubscribe;
  }, [quizId, queryClient, realtime]);
}
```

### Hook Naming & Organization

```
src/hooks/
├── use-quiz-state.ts          # useQuery for quiz data
├── use-submit-answer.ts       # useMutation for answers
├── use-realtime-quiz.ts       # Realtime subscription
├── use-host-dashboard.ts      # Host-specific combined hook
├── use-player-session.ts      # Player-specific combined hook
└── use-realtime-client.tsx    # Realtime adapter context
```

---

## Realtime Adapter

The realtime adapter abstracts away Supabase-specific code so you can swap providers later.

### Interface

```typescript
// src/infrastructure/realtime/realtime-client.ts

export interface RealtimeClient {
  subscribe<T>(channel: string, callback: (event: T) => void): () => void;
  emit<T>(channel: string, event: T): Promise<void>;
  disconnect(): Promise<void>;
}

// Factory
export function createSupabaseRealtimeClient(): RealtimeClient {
  // Implementation using Supabase Realtime
}

export function createNoopRealtimeClient(): RealtimeClient {
  // Stub implementation (no-op)
}
```

### Hook Context

```typescript
// src/hooks/use-realtime-client.tsx

'use client';

import { createContext, useContext } from 'react';
import type { RealtimeClient } from '@infrastructure/realtime/realtime-client';
import { createSupabaseRealtimeClient } from '@infrastructure/realtime/supabase-realtime.client';

const RealtimeClientContext = createContext<RealtimeClient | null>(null);

export function RealtimeClientProvider({ children }: { children: React.ReactNode }) {
  const client = createSupabaseRealtimeClient();
  return (
    <RealtimeClientContext.Provider value={client}>
      {children}
    </RealtimeClientContext.Provider>
  );
}

export function useRealtimeClient(): RealtimeClient | null {
  return useContext(RealtimeClientContext);
}
```

### Usage in App

```typescript
// src/app/providers.tsx

'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { RealtimeClientProvider } from '@hooks/use-realtime-client';
import { queryClient } from './query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeClientProvider>
        {children}
      </RealtimeClientProvider>
    </QueryClientProvider>
  );
}
```

---

## Components

Components are organized by feature and receive DTOs as props.

### Structure

```
src/components/
├── ui/                    # shadcn primitives (Button, Dialog, etc.)
├── admin/                 # Admin feature components
│   ├── quiz-list.tsx
│   ├── create-quiz-dialog.tsx
│   └── question-crud.tsx
├── host/                  # Host feature components
│   ├── host-dashboard.tsx
│   ├── question-timeline.tsx
│   └── stats-card.tsx
└── player/                # Player feature components
    ├── player-join-form.tsx
    ├── answer-pad.tsx
    └── timer-display.tsx
```

### Component Pattern

```typescript
// src/components/host/stats-card.tsx

import type { QuizDTO } from '@application/dtos/quiz.dto';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';

interface StatsCardProps {
  quiz: QuizDTO;
  isLoading: boolean;
  error?: Error | null;
}

export function StatsCard({ quiz, isLoading, error }: StatsCardProps) {
  if (isLoading) return <Card><div>Loading...</div></Card>;
  if (error) return <Card><div>Error: {error.message}</div></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{quiz.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div>Players: {quiz.players?.length ?? 0}</div>
        <div>Correct answers: {quiz.correctAnswers ?? 0}</div>
      </CardContent>
    </Card>
  );
}
```

### Key Patterns

1. **Props typed as DTOs**: `quiz: QuizDTO` not `quiz: Quiz`
2. **Loading/error states**: Handle both gracefully
3. **No business logic**: Only presentation logic (formatting, visibility)
4. **Small, reusable components**: Compose larger views from primitives

---

## Pages (Server & Client Components)

### Server Component Pattern

```typescript
// src/app/(host)/quiz/[quizId]/page.tsx

import { notFound } from 'next/navigation';
import { getServices } from '@application/services/factories';
import { HostDashboardClient } from './client';

export default async function HostDashboardPage({
  params,
}: {
  params: { quizId: string };
}) {
  const { quizId } = await params;

  // Fetch initial data server-side
  const services = getServices();
  const quiz = await services.quizService.getQuizState(quizId);

  if (!quiz) notFound();

  // Pass to client component
  return <HostDashboardClient initialQuiz={quiz} />;
}
```

### Client Component Pattern

```typescript
// src/app/(host)/quiz/[quizId]/client.tsx

'use client';

import { useState } from 'react';
import { useQuizState } from '@hooks/use-quiz-state';
import { useRealtimeQuiz } from '@hooks/use-realtime-quiz';
import type { QuizDTO } from '@application/dtos/quiz.dto';

interface HostDashboardClientProps {
  initialQuiz: QuizDTO;
}

export function HostDashboardClient({ initialQuiz }: HostDashboardClientProps) {
  const quizId = initialQuiz.id;

  // Hydrate hook with initial data
  const { data: quiz = initialQuiz, isLoading } = useQuizState(quizId);

  // Subscribe to realtime updates
  useRealtimeQuiz(quizId);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{quiz.title}</h1>
      <StatsCard quiz={quiz} isLoading={false} />
      {/* More content */}
    </div>
  );
}
```

### Key Patterns

1. **Server component fetches initial data**: Faster hydration, SEO-friendly
2. **Client component manages interaction**: Mutations, realtime, local state
3. **Realtime subscription in useEffect**: Keeps data fresh without polling

---

## Testing Presentation

### Hook Tests

```typescript
// src/tests/app/hooks/use-quiz-state.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useQuizState } from '@hooks/use-quiz-state';
import { createTestQueryClient } from '@tests/setup';

describe('useQuizState', () => {
  it('should fetch quiz state', async () => {
    const wrapper = ({ children }) => (
      <QueryClientProvider client={createTestQueryClient()}>
        {children}
      </QueryClientProvider>
    );

    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'q1', title: 'My Quiz' }),
      } as Response)
    );

    const { result } = renderHook(() => useQuizState('q1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.title).toBe('My Quiz');
  });
});
```

### Component Tests

```typescript
// src/tests/app/components/stats-card.test.tsx

import { render, screen } from '@testing-library/react';
import { StatsCard } from '@components/host/stats-card';

describe('StatsCard', () => {
  it('should render quiz title', () => {
    const quiz = {
      id: 'q1',
      title: 'My Quiz',
      players: [{ id: 'p1', name: 'Alice' }],
      correctAnswers: 5,
    };

    render(<StatsCard quiz={quiz} isLoading={false} />);

    expect(screen.getByText('My Quiz')).toBeInTheDocument();
    expect(screen.getByText('Players: 1')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<StatsCard quiz={{} as any} isLoading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

---

## Common Patterns

### Optimistic Updates

```typescript
const { mutate } = useMutation({
  mutationFn: (answer: string) => submitAnswer(answer),
  onMutate: async (answer) => {
    // Cancel pending queries
    await queryClient.cancelQueries({ queryKey: ['quiz', quizId] });

    // Save previous data for rollback
    const previousQuiz = queryClient.getQueryData(['quiz', quizId]);

    // Update cache optimistically
    queryClient.setQueryData(['quiz', quizId], (old: QuizDTO) => ({
      ...old,
      answers: [...(old.answers ?? []), { playerAnswer: answer }],
    }));

    return { previousQuiz };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    if (context?.previousQuiz) {
      queryClient.setQueryData(['quiz', quizId], context.previousQuiz);
    }
  },
});
```

### Combining Queries & Realtime

```typescript
export function useQuizDashboard(quizId: string) {
  // Query: Initial state + manual refetch
  const { data: quiz } = useQuizState(quizId);

  // Realtime: Live updates
  useRealtimeQuiz(quizId);

  return { quiz };
}
```

---

## Related Documentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) – Data flow and layer contracts
- [guides/DDD-STRUCTURE.md](DDD-STRUCTURE.md) – Domain entities and application layer
- [guides/SETUP.md](SETUP.md) – TanStack Query and environment setup
- [DECISION-LOG.md](../DECISION-LOG.md) – ADR-004 on TanStack Query, ADR-010 on E2E testing
