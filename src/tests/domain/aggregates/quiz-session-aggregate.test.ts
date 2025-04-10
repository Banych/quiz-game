import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';
import { Player } from '@domain/entities/player';
import { Question } from '@domain/entities/question';
import { Quiz, QuizStatus } from '@domain/entities/quiz';
import { describe, expect, it } from 'vitest';

describe('QuizSessionAggregate', () => {
  it('should initialize with the given quiz and timer duration', () => {
    const quiz = new Quiz('quiz1', 'Math Quiz', [], {
      timePerQuestion: 30,
      allowSkipping: true,
    });
    const aggregate = new QuizSessionAggregate(quiz, 30);

    expect(aggregate.quiz).toBe(quiz);
    expect(aggregate.timer.duration).toBe(30);
    expect(aggregate.scores.size).toBe(0);
  });

  it('should start the quiz and timer', () => {
    const quiz = new Quiz('quiz1', 'Math Quiz', [], {
      timePerQuestion: 30,
      allowSkipping: true,
    });
    const aggregate = new QuizSessionAggregate(quiz, 30);

    aggregate.startQuiz();

    expect(aggregate.quiz.status).toBe(QuizStatus.Active);
    expect(aggregate.timer.startTime).toBeDefined();
  });

  it('should end the quiz', () => {
    const quiz = new Quiz('quiz1', 'Math Quiz', [], {
      timePerQuestion: 30,
      allowSkipping: true,
    });
    const aggregate = new QuizSessionAggregate(quiz, 30);

    aggregate.startQuiz();
    aggregate.endQuiz();

    expect(aggregate.quiz.status).toBe(QuizStatus.Completed);
  });

  it('should submit an answer and update the score if correct', () => {
    const questions = [new Question('q1', 'What is 2 + 2?', ['4'], 'text', 10)];
    const quiz = new Quiz('quiz1', 'Math Quiz', questions, {
      timePerQuestion: 30,
      allowSkipping: true,
    });
    const player = new Player('p1', 'John Doe');
    quiz.addPlayer(player);

    const aggregate = new QuizSessionAggregate(quiz, 30);
    aggregate.startQuiz();

    aggregate.submitAnswer('p1', 'q1', '4');

    expect(player.answers.size).toBe(1);
    expect(player.answers.get('q1')?.isCorrect).toBe(true);
    expect(aggregate.scores.get('p1')?.value).toBe(10);
  });

  it('should submit an answer and not update the score if incorrect', () => {
    const questions = [new Question('q1', 'What is 2 + 2?', ['4'], 'text', 10)];
    const quiz = new Quiz('quiz1', 'Math Quiz', questions, {
      timePerQuestion: 30,
      allowSkipping: true,
    });
    const player = new Player('p1', 'John Doe');
    quiz.addPlayer(player);

    const aggregate = new QuizSessionAggregate(quiz, 30);
    aggregate.startQuiz();

    aggregate.submitAnswer('p1', 'q1', '5');

    expect(player.answers.size).toBe(1);
    expect(player.answers.get('q1')?.isCorrect).toBe(false);
    expect(aggregate.scores.get('p1')?.value).toBe(0);
  });

  it('should throw an error if submitting an answer for an invalid player or question', () => {
    const quiz = new Quiz('quiz1', 'Math Quiz', [], {
      timePerQuestion: 30,
      allowSkipping: true,
    });
    const aggregate = new QuizSessionAggregate(quiz, 30);
    aggregate.startQuiz();

    expect(() =>
      aggregate.submitAnswer('invalidPlayer', 'invalidQuestion', '4')
    ).toThrow('Invalid player or question.');
  });

  it('should generate a leaderboard sorted by score', () => {
    const questions = [new Question('q1', 'What is 2 + 2?', ['4'], 'text', 10)];
    const quiz = new Quiz('quiz1', 'Math Quiz', questions, {
      timePerQuestion: 30,
      allowSkipping: true,
    });
    const player1 = new Player('p1', 'John Doe');
    const player2 = new Player('p2', 'Jane Doe');
    quiz.addPlayer(player1);
    quiz.addPlayer(player2);

    const aggregate = new QuizSessionAggregate(quiz, 30);
    aggregate.startQuiz();

    aggregate.submitAnswer('p1', 'q1', '4');
    aggregate.submitAnswer('p2', 'q1', '5');

    const leaderboard = aggregate.getLeaderboard();

    expect(leaderboard).toEqual([
      { playerId: 'p1', score: 10 },
      { playerId: 'p2', score: 0 },
    ]);
  });
});
