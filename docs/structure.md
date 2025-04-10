# Application Structure and Domain Design

## Overview
The application will follow a **layered architecture** with three distinct layers:
1. **Domain Layer**: Core business logic and entities.
2. **Application Layer**: Use cases and application-specific logic.
3. **Infrastructure Layer**: External dependencies like databases, APIs, and frameworks.

This structure ensures separation of concerns, testability, and scalability.

---

## Layers

### 1. Domain Layer
- **Purpose**: Encapsulates the core business logic and rules.
- **Components**:
  - **Entities**: Represent core business objects with attributes and behavior.
  - **Value Objects**: Immutable objects that represent concepts (e.g., `Timer`, `Score`).
  - **Aggregates**: Group of entities treated as a single unit (e.g., `Quiz` with `Questions`).
  - **Domain Events**: Events triggered by changes in the domain (e.g., `PlayerAnsweredEvent`).
  - **Repositories (Interfaces)**: Abstract interfaces for data access.

---

## Domain Entities

### 1. `Quiz`
- **Attributes**:
  - `id`: Unique identifier.
  - `title`: Name of the quiz.
  - `questions`: List of `Question` entities.
  - `status`: Current status (`Pending`, `Active`, `Completed`).
  - `players`: List of `Player` entities.
  - `startTime`: Timestamp when the quiz starts.
  - `endTime`: Timestamp when the quiz ends.
  - `settings`: Quiz-specific configurations (e.g., time per question, scoring rules).
- **Behavior**:
  - Start the quiz.
  - End the quiz.
  - Add/remove players.
  - Transition between quiz states.
  - Shuffle questions if needed.
  - Track the current question index.

---

### 2. `Question`
- **Attributes**:
  - `id`: Unique identifier.
  - `text`: Question text.
  - `media`: Optional media (image, video, audio).
  - `mediaType`: Type of media (e.g., `image`, `video`, `audio`).
  - `options`: List of possible answers (for multiple-choice questions).
  - `correctAnswers`: List of acceptable answers (e.g., ["Paris", "paris", "PARIS"]).
  - `type`: Question type (e.g., `multiple-choice`, `text`, `true/false`).
  - `points`: Score for the question.
- **Behavior**:
  - Validate an answer:
    - Normalize input (e.g., trim whitespace, ignore case).
    - Support fuzzy matching for typos or alternative formats.
    - Allow regex patterns for complex answers.
  - Randomize the order of options for multiple-choice questions.
  - Check if the question has been answered correctly.

---

### 3. `Player`
- **Attributes**:
  - `id`: Unique identifier.
  - `name`: Player's name.
  - `score`: Player's current score.
  - `answers`: Map of `questionId -> Answer`.
  - `status`: Player's status (`Active`, `Disconnected`, `Finished`).
  - `rank`: Player's position in the leaderboard.
- **Behavior**:
  - Submit an answer.
  - Update score.
  - Track answers for each question.
  - Calculate the total score based on correct answers and scoring rules.

---

### 4. `Answer`
- **Attributes**:
  - `playerId`: ID of the player who submitted the answer.
  - `questionId`: ID of the question being answered.
  - `value`: The submitted answer.
  - `timestamp`: Time of submission.
  - `isCorrect`: Whether the answer was correct.
  - `timeTaken`: Time taken to answer.
- **Behavior**:
  - Store the submitted answer and metadata.
  - Validation logic is handled by the `Question` entity.

---

## Folder Structure

```plaintext
src/
├── app/                # Next.js pages and routing
├── components/         # UI components
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
