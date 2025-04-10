import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';
import { Player } from '@domain/entities/player';
import { Question } from '@domain/entities/question';
import { Quiz, QuizStatus } from '@domain/entities/quiz';
import { describe, it, expect } from 'vitest';

describe('Quiz Session Integration', () => {
  it('should handle a complete quiz session with multiple players and questions', () => {
    const questions = [
      new Question('q1', 'What is 2 + 2?', ['4'], 'text', 10),
      new Question(
        'q2',
        'What is the capital of France?',
        ['Paris'],
        'text',
        15
      ),
    ];
    const quiz = new Quiz('quiz1', 'General Knowledge Quiz', questions, {
      timePerQuestion: 30,
      allowSkipping: true,
    });

    const player1 = new Player('p1', 'Alice');
    const player2 = new Player('p2', 'Bob');
    quiz.addPlayer(player1);
    quiz.addPlayer(player2);

    const aggregate = new QuizSessionAggregate(quiz, 30);

    aggregate.startQuiz();
    expect(quiz.status).toBe(QuizStatus.Active);

    aggregate.submitAnswer('p1', 'q1', '4');
    expect(player1.answers.get('q1')?.isCorrect).toBe(true);
    expect(aggregate.scores.get('p1')?.value).toBe(10);

    aggregate.submitAnswer('p2', 'q1', '5');
    expect(player2.answers.get('q1')?.isCorrect).toBe(false);
    expect(aggregate.scores.get('p2')?.value).toBe(0);

    const nextQuestion = quiz.nextQuestion();
    expect(nextQuestion?.id).toBe('q2');

    aggregate.submitAnswer('p1', 'q2', 'London');
    expect(player1.answers.get('q2')?.isCorrect).toBe(false);
    expect(aggregate.scores.get('p1')?.value).toBe(10);

    aggregate.submitAnswer('p2', 'q2', 'Paris');
    expect(player2.answers.get('q2')?.isCorrect).toBe(true);
    expect(aggregate.scores.get('p2')?.value).toBe(15);

    aggregate.endQuiz();
    expect(quiz.status).toBe(QuizStatus.Completed);

    const leaderboard = aggregate.getLeaderboard();
    expect(leaderboard).toEqual([
      { playerId: 'p2', score: 15 },
      { playerId: 'p1', score: 10 },
    ]);
  });

  it('should throw an error if a player submits an answer after the quiz ends', () => {
    const questions = [new Question('q1', 'What is 2 + 2?', ['4'], 'text', 10)];
    const quiz = new Quiz('quiz1', 'Math Quiz', questions, {
      timePerQuestion: 30,
      allowSkipping: true,
    });
    const player = new Player('p1', 'Alice');
    quiz.addPlayer(player);

    const aggregate = new QuizSessionAggregate(quiz, 30);
    aggregate.startQuiz();
    aggregate.endQuiz();

    expect(() => aggregate.submitAnswer('p1', 'q1', '4')).toThrow(
      'Quiz is not active.'
    );
  });
});
