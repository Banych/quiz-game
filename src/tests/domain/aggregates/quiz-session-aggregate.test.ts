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

    expect(aggregate.quizId).toBe(quiz.id);
    expect(aggregate.quizTitle).toBe(quiz.title);
    expect(aggregate.quizStatus).toBe(QuizStatus.Pending);
    expect(aggregate.quizSettings.timePerQuestion).toBe(30);
    expect(aggregate.quizQuestions).toHaveLength(0);
    expect(aggregate.timerDuration).toBe(30);
    expect(aggregate.timerStartTime).toBeUndefined();
    expect(aggregate.timerEndTime).toBeUndefined();
    expect(aggregate.currentQuestion).toBeNull();
    expect(aggregate.answers.size).toBe(0);
  });

  it('should start the quiz and timer', () => {
    const quiz = new Quiz('quiz1', 'Math Quiz', [], {
      timePerQuestion: 30,
      allowSkipping: true,
    });
    const aggregate = new QuizSessionAggregate(quiz, 30);

    aggregate.startQuiz();

    expect(aggregate.quizStatus).toBe(QuizStatus.Active);
    expect(aggregate.timerStartTime).toBeDefined();
  });

  it('should end the quiz', () => {
    const quiz = new Quiz('quiz1', 'Math Quiz', [], {
      timePerQuestion: 30,
      allowSkipping: true,
    });
    const aggregate = new QuizSessionAggregate(quiz, 30);

    aggregate.startQuiz();
    aggregate.endQuiz();

    expect(aggregate.quizStatus).toBe(QuizStatus.Completed);
  });

  it('should submit an answer and update the score if correct', () => {
    const questions = [new Question('q1', 'What is 2 + 2?', ['4'], 'text', 10)];
    const quiz = new Quiz('quiz1', 'Math Quiz', questions, {
      timePerQuestion: 30,
      allowSkipping: true,
    });
    const player = new Player('p1', 'John Doe');

    const aggregate = new QuizSessionAggregate(quiz, 30);
    aggregate.addPlayer(player.id);
    aggregate.startQuiz();

    aggregate.submitAnswer(player.id, 'q1', '4');

    expect(aggregate.answers.size).toBe(1);
    const playerAnswers = aggregate.answers.get(player.id);
    expect(playerAnswers).toBeDefined();
    expect(playerAnswers?.length).toBe(1);
    expect(playerAnswers?.[0].questionId).toBe('q1');
    expect(playerAnswers?.[0].value).toBe('4');
    expect(playerAnswers?.[0].isCorrect).toBe(true);

    const score = aggregate
      .getLeaderboard()
      .find((score) => score.playerId === player.id);
    expect(score).toBeDefined();
    expect(score?.score).toBe(10);
  });

  it('should submit an answer and not update the score if incorrect', () => {
    const questions = [new Question('q1', 'What is 2 + 2?', ['4'], 'text', 10)];
    const quiz = new Quiz('quiz1', 'Math Quiz', questions, {
      timePerQuestion: 30,
      allowSkipping: true,
    });
    const player = new Player('p1', 'John Doe');

    const aggregate = new QuizSessionAggregate(quiz, 30);
    aggregate.addPlayer(player.id);
    aggregate.startQuiz();

    aggregate.submitAnswer(player.id, 'q1', '5');

    expect(aggregate.answers.size).toBe(1);
    const playerAnswers = aggregate.answers.get(player.id);
    expect(playerAnswers).toBeDefined();
    expect(playerAnswers?.length).toBe(1);
    expect(playerAnswers?.[0].questionId).toBe('q1');
    expect(playerAnswers?.[0].value).toBe('5');
    expect(playerAnswers?.[0].isCorrect).toBe(false);

    const score = aggregate
      .getLeaderboard()
      .find((score) => score.playerId === player.id);
    expect(score).toBeDefined();
    expect(score?.score).toBe(0);
  });

  it('should throw an error if submitting an answer when quiz is not active', () => {
    const questions = [new Question('q1', 'What is 2 + 2?', ['4'], 'text', 10)];
    const quiz = new Quiz('quiz1', 'Math Quiz', questions, {
      timePerQuestion: 30,
      allowSkipping: true,
    });
    const player = new Player('p1', 'John Doe');
    const aggregate = new QuizSessionAggregate(quiz, 30);
    aggregate.addPlayer(player.id);

    expect(() => aggregate.submitAnswer(player.id, 'q1', '4')).toThrow(
      'Quiz is not active.'
    );
  });

  it('should throw an error if submitting an answer for an invalid question', () => {
    const questions = [new Question('q1', 'What is 2 + 2?', ['4'], 'text', 10)];
    const quiz = new Quiz('quiz1', 'Math Quiz', questions, {
      timePerQuestion: 30,
      allowSkipping: true,
    });
    const player = new Player('p1', 'John Doe');
    const aggregate = new QuizSessionAggregate(quiz, 30);
    aggregate.addPlayer(player.id);
    aggregate.startQuiz();
    expect(() =>
      aggregate.submitAnswer(player.id, 'invalidQuestion', '4')
    ).toThrow('Invalid question.');
  });

  it('should throw an error if submitting an answer for an invalid player', () => {
    const quiz = new Quiz(
      'quiz1',
      'Math Quiz',
      [new Question('q1', 'What is 2 + 2?', ['4'], 'text', 10)],
      {
        timePerQuestion: 30,
        allowSkipping: true,
      }
    );
    const aggregate = new QuizSessionAggregate(quiz, 30);
    aggregate.startQuiz();

    expect(() => aggregate.submitAnswer('invalidPlayer', 'q1', '4')).toThrow(
      'Player is not part of this quiz.'
    );
  });

  it('should generate a leaderboard sorted by score', () => {
    const questions = [new Question('q1', 'What is 2 + 2?', ['4'], 'text', 10)];
    const quiz = new Quiz('quiz1', 'Math Quiz', questions, {
      timePerQuestion: 30,
      allowSkipping: true,
    });
    const player1 = new Player('p1', 'John Doe');
    const player2 = new Player('p2', 'Jane Doe');

    const aggregate = new QuizSessionAggregate(quiz, 30);
    aggregate.addPlayer(player1.id);
    aggregate.addPlayer(player2.id);
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
