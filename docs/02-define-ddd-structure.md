# Step 2: Define DDD Structure

## Objective
Establish a clear and scalable structure for the application following Domain-Driven Design (DDD) principles. This step will focus on defining the folder structure, core entities, value objects, aggregates, domain events, and repository interfaces.

---

## Plan

1. **Folder Structure**:
   - [x] Create a folder structure that separates the **Domain**, **Application**, and **Infrastructure** layers.
   - [ ] Ensure each layer has a clear responsibility and avoids cross-layer dependencies.

2. **Define Core Entities**:
   - [x] Identify and define the core entities (`Quiz`, `Question`, `Player`, `Answer`) with their attributes and behaviors.

3. **Implement Value Objects**:
   - [x] Create value objects for reusable and immutable concepts (e.g., `Timer`, `Score`).

4. **Define Aggregates**:
   - [x] Group related entities into aggregates (e.g., `QuizAggregate` to manage `Quiz` and its `Questions`).

5. **Domain Events**:
   - [x] Define domain events to capture significant changes in the domain (e.g., `PlayerAnsweredEvent`, `QuizStartedEvent`).

6. **Repository Interfaces**:
   - [x] Create repository interfaces for data access, ensuring the domain layer is decoupled from the infrastructure.

7. **Testing**:
   - [ ] Write unit tests for the domain layer to ensure the correctness of entities, value objects, and aggregates.

---

## Folder Structure

```plaintext
src/
├── domain/             # Domain layer
│   ├── entities/       # Core entities (e.g., Quiz, Question, Player)
│   ├── valueObjects/   # Value objects (e.g., Timer, Score)
│   ├── aggregates/     # Aggregates (e.g., QuizAggregate)
│   ├── events/         # Domain events (e.g., PlayerAnsweredEvent)
│   └── repositories/   # Repository interfaces
├── application/        # Application layer
│   ├── useCases/       # Use cases (e.g., StartQuiz, SubmitAnswer)
│   └── services/       # Application services
├── infrastructure/     # Infrastructure layer
│   ├── repositories/   # Repository implementations
│   ├── database/       # Database configuration and models
│   ├── api/            # External API integrations
│   └── websocket/      # WebSocket/Socket.io logic
└── lib/                # Shared utilities and helpers