# Guide: Building the Domain Layer (DDD Structure)

This guide covers how to define domain entities, value objects, aggregates, repositories, and events. It's the foundation for all business logic in the quiz game.

## Overview

The domain layer is the **pure business logic layer** – no Next.js, React, or Prisma code. Entities enforce invariants, value objects represent concepts, aggregates coordinate state, and repositories define persistence contracts.

**Location**: `src/domain/**`

---

## Entities

Entities are domain objects with **identity** (an ID that doesn't change) and **mutable behavior** (methods that change their state).

### Pattern

```typescript
// src/domain/entities/quiz.ts

export class Quiz {
  private id: string;
  private title: string;
  private status: QuizStatus = 'DRAFT';
  private questions: Question[] = [];
  private events: DomainEvent[] = [];

  constructor(id: string, title: string) {
    if (!title || title.trim().length === 0) {
      throw new InvalidQuizTitleError('Title cannot be empty');
    }
    this.id = id;
    this.title = title;
  }

  // Query: Get ID
  getId(): string {
    return this.id;
  }

  // Command: Add question
  addQuestion(question: Question): void {
    if (this.status !== 'DRAFT') {
      throw new InvalidStateError('Cannot add questions to active quiz');
    }
    this.questions.push(question);
  }

  // Command: Start quiz
  start(): void {
    if (this.questions.length === 0) {
      throw new InvalidStateError('Quiz must have at least one question');
    }
    if (this.status !== 'DRAFT') {
      throw new InvalidStateError('Quiz already started');
    }
    this.status = 'ACTIVE';
    this.events.push(new QuizStartedEvent(this.id, Date.now()));
  }

  // Query: Get all questions
  getQuestions(): Question[] {
    return [...this.questions]; // Return copy to prevent external mutation
  }

  // Query: Get domain events
  getDomainEvents(): DomainEvent[] {
    return this.events;
  }

  // Helper: Clear events after publishing
  clearDomainEvents(): void {
    this.events = [];
  }
}
```

### Key Principles

1. **Encapsulation**: All properties are `private`; access via methods only
2. **Invariants**: Constructor + methods enforce rules (e.g., "title cannot be empty", "can't start without questions")
3. **Commands vs Queries**: Methods that change state (commands) vs. methods that read state (queries)
4. **Domain events**: Record important state changes via events for realtime broadcasting
5. **No framework code**: No Next.js, React, Prisma, or HTTP concepts in entities

### Invariant Examples

```typescript
// ✅ Good: Enforce invariants in constructor
export class Answer {
  constructor(
    private questionId: string,
    private playerId: string,
    private value: string,
    private submittedAt: Date
  ) {
    if (!questionId) throw new InvalidArgumentError('questionId required');
    if (!playerId) throw new InvalidArgumentError('playerId required');
    if (!value) throw new InvalidArgumentError('value required');
  }
}

// ❌ Bad: Allow invalid state
export class Answer {
  constructor(
    public questionId: string,
    public playerId: string,
    public value: string,
    public submittedAt: Date
  ) {
    // No validation; invalid state possible
  }
}
```

---

## Value Objects

Value Objects are immutable domain concepts identified by **equality, not identity**. They have no ID and represent concepts like `Score`, `Timer`, or `JoinCode`.

### Pattern

```typescript
// src/domain/value-objects/score.ts

export class Score {
  private readonly points: number;
  private readonly maxPoints: number;

  constructor(points: number, maxPoints: number = 1000) {
    if (points < 0 || points > maxPoints) {
      throw new InvalidScoreError(
        `Score must be between 0 and ${maxPoints}, got ${points}`
      );
    }
    this.points = points;
    this.maxPoints = maxPoints;
  }

  getPoints(): number {
    return this.points;
  }

  getPercentage(): number {
    return (this.points / this.maxPoints) * 100;
  }

  // Equality: Two scores with same points are equal
  equals(other: Score): boolean {
    return this.points === other.points && this.maxPoints === other.maxPoints;
  }

  // Display formatting
  toString(): string {
    return `${this.points}/${this.maxPoints}`;
  }
}

export class Timer {
  private readonly startedAt: Date;
  private readonly durationMs: number;

  constructor(durationSeconds: number) {
    if (durationSeconds <= 0) {
      throw new InvalidTimerError('Duration must be > 0');
    }
    this.startedAt = new Date();
    this.durationMs = durationSeconds * 1000;
  }

  getRemainingMs(): number {
    const elapsed = Date.now() - this.startedAt.getTime();
    return Math.max(0, this.durationMs - elapsed);
  }

  isExpired(): boolean {
    return this.getRemainingMs() === 0;
  }
}
```

### Key Principles

1. **Immutable**: Once created, never change (no setters)
2. **Equality-based**: `a.equals(b)` not `a === b`
3. **Self-validating**: Constructor enforces constraints
4. **No ID**: Identified by values, not a primary key
5. **Behavior-rich**: Encapsulate logic (e.g., `Timer.getRemainingMs()`)

---

## Aggregates

Aggregates are **clusters of entities coordinated under a single root entity**. The root is the only entity you can hold a reference to from outside.

### Pattern

```typescript
// src/domain/aggregates/quiz-session.aggregate.ts

export class QuizSessionAggregate {
  private readonly quiz: Quiz; // Root entity
  private readonly players: Map<string, Player> = new Map();
  private readonly round: Round = new Round();
  private readonly leaderboard: Leaderboard = new Leaderboard();

  constructor(quiz: Quiz) {
    this.quiz = quiz;
  }

  // Public command: Add player
  addPlayer(player: Player): void {
    if (this.quiz.getStatus() !== 'DRAFT') {
      throw new InvalidStateError('Cannot add players after quiz starts');
    }
    this.players.set(player.getId(), player);
  }

  // Public command: Start round
  startRound(): void {
    if (this.quiz.getStatus() !== 'DRAFT') {
      throw new InvalidStateError('Quiz already started');
    }
    this.quiz.start();
    this.round.start();
  }

  // Public command: Submit answer
  submitAnswer(playerId: string, questionId: string, answer: string): Answer {
    const player = this.players.get(playerId);
    if (!player) throw new PlayerNotFoundError(playerId);

    const question = this.quiz.getQuestion(questionId);
    if (!question) throw new QuestionNotFoundError(questionId);

    if (!this.round.isActive()) {
      throw new InvalidStateError('Round not active');
    }

    // Validate answer format
    const validationResult = question.validateAnswer(answer);
    if (!validationResult.isValid) {
      throw new InvalidAnswerError(validationResult.reason);
    }

    // Record answer
    const answerEntity = new Answer(
      questionId,
      playerId,
      answer,
      new Date()
    );

    // Update player score
    const isCorrect = question.isAnswerCorrect(answer);
    const points = this.calculateScore(question, isCorrect, this.round.getElapsedMs());
    player.recordAnswer(answerEntity, new Score(points));

    // Emit event for broadcasting
    this.round.recordEvent(
      new PlayerAnsweredEvent(playerId, questionId, isCorrect, points)
    );

    return answerEntity;
  }

  // Private helper: Scoring logic
  private calculateScore(
    question: Question,
    isCorrect: boolean,
    elapsedMs: number
  ): number {
    if (!isCorrect) return 0;
    const basePoints = question.getPoints();
    const durationMs = question.getDurationMs();
    return Math.floor(basePoints * Math.exp(-2 * (elapsedMs / durationMs)));
  }

  // Public query: Get quiz DTO for broadcasting
  getSnapshot(): QuizSessionDTO {
    return {
      quizId: this.quiz.getId(),
      status: this.quiz.getStatus(),
      players: Array.from(this.players.values()).map(p => ({
        id: p.getId(),
        name: p.getName(),
        score: p.getScore().getPoints(),
      })),
      currentRound: this.round.getNumber(),
      leaderboard: this.leaderboard.getTop10(),
    };
  }
}
```

### Key Principles

1. **Single root entity** (Quiz, in this case)
2. **Coordinate child entities** (Player, Round) via root
3. **Enforce aggregate-level invariants** (e.g., "can't submit answers after quiz ends")
4. **Emit domain events** for important state changes
5. **Expose snapshots** (DTOs) for external communication

---

## Domain Events

Domain events record **what happened** in the domain. They're immutable, contain DTO-ready payloads, and are used for:
- Realtime broadcasting to clients
- Audit logging
- Side effects (send email, update analytics)

### Pattern

```typescript
// src/domain/events/quiz-events.ts

export interface DomainEvent {
  eventType: string;
  aggregateId: string;
  timestamp: Date;
  payload: Record<string, unknown>;
}

export class QuizStartedEvent implements DomainEvent {
  eventType = 'quiz.started' as const;

  constructor(
    public aggregateId: string, // Quiz ID
    public timestamp: Date = new Date(),
    public payload: {
      quizId: string;
      startedAt: string;
    } = {
      quizId: aggregateId,
      startedAt: new Date().toISOString(),
    }
  ) {}
}

export class PlayerAnsweredEvent implements DomainEvent {
  eventType = 'player.answered' as const;

  constructor(
    public aggregateId: string, // Quiz ID
    public timestamp: Date = new Date(),
    public payload: {
      quizId: string;
      playerId: string;
      questionId: string;
      isCorrect: boolean;
      pointsEarned: number;
      answeredAt: string;
    } = {
      quizId: aggregateId,
      playerId: '',
      questionId: '',
      isCorrect: false,
      pointsEarned: 0,
      answeredAt: new Date().toISOString(),
    }
  ) {}

  static create(
    quizId: string,
    playerId: string,
    questionId: string,
    isCorrect: boolean,
    pointsEarned: number
  ): PlayerAnsweredEvent {
    return new PlayerAnsweredEvent(quizId, new Date(), {
      quizId,
      playerId,
      questionId,
      isCorrect,
      pointsEarned,
      answeredAt: new Date().toISOString(),
    });
  }
}

export class QuizEndedEvent implements DomainEvent {
  eventType = 'quiz.ended' as const;

  constructor(
    public aggregateId: string,
    public timestamp: Date = new Date(),
    public payload: {
      quizId: string;
      endedAt: string;
      leaderboard: Array<{ playerId: string; score: number }>;
    } = {
      quizId: aggregateId,
      endedAt: new Date().toISOString(),
      leaderboard: [],
    }
  ) {}
}
```

### Usage

```typescript
// In entity/aggregate
quiz.start();
this.events.push(new QuizStartedEvent(quiz.getId()));

// Later: Publish to realtime
const events = quiz.getDomainEvents();
events.forEach(event => {
  realtime.emit(`quiz:${event.aggregateId}`, event.payload);
});
quiz.clearDomainEvents(); // Prevent duplicate publishing
```

---

## Repository Interfaces

Repositories define **persistence contracts** without revealing implementation details (Prisma, SQL, etc.).

### Pattern

```typescript
// src/domain/repositories/quiz-repository.ts

export interface IQuizRepository {
  /**
   * Find a Quiz entity by ID (for admin operations).
   * Note: Returns Quiz entity, not QuizSessionAggregate.
   */
  findEntityById(id: string): Promise<Quiz | null>;

  /**
   * Find a Quiz by join code (for player joining).
   */
  findByJoinCode(code: string): Promise<Quiz | null>;

  /**
   * List all quizzes (for admin dashboard).
   */
  findAll(): Promise<Quiz[]>;

  /**
   * Save a Quiz entity (create or update).
   */
  save(quiz: Quiz): Promise<void>;

  /**
   * Delete a Quiz entity.
   */
  delete(id: string): Promise<void>;
}

export interface IPlayerRepository {
  /**
   * Find a Player by ID.
   */
  findById(id: string): Promise<Player | null>;

  /**
   * List all players for a quiz session.
   */
  findByQuizId(quizId: string): Promise<Player[]>;

  /**
   * Save a Player (create or update).
   */
  save(player: Player): Promise<void>;

  /**
   * Delete a Player.
   */
  delete(id: string): Promise<void>;
}

export interface IAnswerRepository {
  /**
   * Find all answers for a question.
   */
  findByQuestionId(questionId: string): Promise<Answer[]>;

  /**
   * Find all answers by a player.
   */
  findByPlayerId(playerId: string): Promise<Answer[]>;

  /**
   * Save an Answer.
   */
  save(answer: Answer): Promise<void>;
}
```

### Key Principles

1. **Framework-agnostic**: No Prisma types, no SQL syntax
2. **Domain-centric**: Methods return/accept domain entities, not DTOs
3. **Async**: All methods return `Promise` (persistence is inherently async)
4. **Slim interface**: Only methods you actually need
5. **Documented**: JSDoc comments explain each method's purpose

---

## Status Enums

Use TypeScript enums for domain constants (statuses, roles, etc.):

```typescript
// src/domain/types/quiz-status.ts

export enum QuizStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
}

export enum PlayerStatus {
  LOBBY = 'LOBBY',
  ANSWERING = 'ANSWERING',
  ANSWERED = 'ANSWERED',
  DISCONNECTED = 'DISCONNECTED',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  TEXT = 'TEXT',
}
```

---

## Testing Domain Logic

Domain entities are tested in isolation via Vitest:

```typescript
// src/tests/domain/entities/quiz.test.ts

import { describe, it, expect } from 'vitest';
import { Quiz } from '@domain/entities/quiz';
import { InvalidStateError } from '@domain/errors';

describe('Quiz Entity', () => {
  it('should create a quiz', () => {
    const quiz = new Quiz('q1', 'My Quiz');
    expect(quiz.getId()).toBe('q1');
    expect(quiz.getStatus()).toBe('DRAFT');
  });

  it('should throw if title is empty', () => {
    expect(() => new Quiz('q1', '')).toThrow(InvalidQuizTitleError);
  });

  it('should start a quiz', () => {
    const quiz = new Quiz('q1', 'My Quiz');
    const question = new Question('q1', 'Q1', 'MULTIPLE_CHOICE', ['A', 'B']);
    quiz.addQuestion(question);
    quiz.start();
    expect(quiz.getStatus()).toBe('ACTIVE');
  });

  it('should emit QuizStartedEvent when starting', () => {
    const quiz = new Quiz('q1', 'My Quiz');
    quiz.addQuestion(new Question('q1', 'Q1', 'MULTIPLE_CHOICE', ['A', 'B']));
    quiz.start();
    const events = quiz.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('quiz.started');
  });

  it('should throw if starting without questions', () => {
    const quiz = new Quiz('q1', 'My Quiz');
    expect(() => quiz.start()).toThrow(InvalidStateError);
  });
});
```

---

## Common Patterns

### Adding a Field to an Entity

If you need to add `isPublished` to Quiz:

1. **Add to entity**:
   ```typescript
   export class Quiz {
     private isPublished: boolean = false;

     publish(): void {
       if (this.status !== 'DRAFT') throw new Error('...');
       this.isPublished = true;
       this.events.push(new QuizPublishedEvent(this.id));
     }

     getIsPublished(): boolean {
       return this.isPublished;
     }
   }
   ```

2. **Add test**:
   ```typescript
   it('should publish a quiz', () => {
     const quiz = new Quiz('q1', 'My Quiz');
     quiz.publish();
     expect(quiz.getIsPublished()).toBe(true);
   });
   ```

3. **Update Prisma schema** (handled in guides/DATA-LAYER.md)

4. **Update DTO mapper** (handled in guides/PRESENTATION-LAYER.md)

---

## Related Documentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) – Layer contracts and design decisions
- [guides/DATA-LAYER.md](DATA-LAYER.md) – Repository implementations (Prisma)
- [guides/PRESENTATION-LAYER.md](PRESENTATION-LAYER.md) – DTOs and service layer
- [DECISION-LOG.md](../DECISION-LOG.md) – ADR-001 on DDD-lite patterns

---

## Checklist: Adding a New Entity

- [ ] Create entity class in `src/domain/entities/`
- [ ] Enforce invariants in constructor
- [ ] Add commands (mutating methods) and queries (read methods)
- [ ] Emit domain events for important state changes
- [ ] Create repository interface in `src/domain/repositories/`
- [ ] Write domain unit tests in `src/tests/domain/entities/`
- [ ] Implement Prisma model and repository (see guides/DATA-LAYER.md)
- [ ] Create DTOs and mappers (see guides/PRESENTATION-LAYER.md)
