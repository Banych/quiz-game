import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';
import { Answer } from '@domain/entities/answer';
import { Player } from '@domain/entities/player';
import { Question } from '@domain/entities/question';
import { Quiz, QuizStatus } from '@domain/entities/quiz';
import { LeaderboardScore } from '@domain/types/leaderboard-score';
import { describe, it, expect } from 'vitest';

const validatePlayerAnswer = (
  answers: Answer[],
  playerId: string,
  questionId: string,
  answer: string,
  isCorrect: boolean,
  answersCount: number = 1
) => {
  const playerAnswers = answers.filter((ans) => ans.playerId === playerId);
  const playerAnswer = playerAnswers.find(
    (ans) => ans.questionId === questionId
  );
  expect(playerAnswers).toHaveLength(answersCount);
  expect(playerAnswer).toBeDefined();
  expect(playerAnswer!.questionId).toBe(questionId);
  expect(playerAnswer!.value).toBe(answer);
  expect(playerAnswer!.isCorrect).toBe(isCorrect);
};

const validatePlayerScore = (
  scores: LeaderboardScore[],
  playerId: string,
  expectedScore: number
) => {
  const playerScore = scores.find((score) => score.playerId === playerId);
  expect(playerScore).toBeDefined();
  expect(playerScore?.score).toBe(expectedScore);
};

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

    const aggregate = new QuizSessionAggregate(quiz, 30);
    aggregate.addPlayer(player1.id);
    aggregate.addPlayer(player2.id);

    aggregate.startQuiz();
    expect(aggregate.quizStatus).toBe(QuizStatus.Active);

    aggregate.submitAnswer('p1', 'q1', '4');
    validatePlayerAnswer(
      aggregate.answers.get(player1.id) || [],
      player1.id,
      'q1',
      '4',
      true
    );
    validatePlayerScore(aggregate.getLeaderboard(), player1.id, 10);

    aggregate.submitAnswer('p2', 'q1', '5');
    validatePlayerAnswer(
      aggregate.answers.get(player2.id) || [],
      player2.id,
      'q1',
      '5',
      false
    );
    validatePlayerScore(aggregate.getLeaderboard(), player2.id, 0);

    const nextQuestion = quiz.nextQuestion();
    expect(nextQuestion?.id).toBe('q2');

    aggregate.submitAnswer('p1', 'q2', 'London');
    validatePlayerAnswer(
      aggregate.answers.get(player1.id) || [],
      player1.id,
      'q2',
      'London',
      false,
      2
    );
    validatePlayerScore(aggregate.getLeaderboard(), player1.id, 10);

    aggregate.submitAnswer('p2', 'q2', 'Paris');
    validatePlayerAnswer(
      aggregate.answers.get(player2.id) || [],
      player2.id,
      'q2',
      'Paris',
      true,
      2
    );
    validatePlayerScore(aggregate.getLeaderboard(), player2.id, 15);

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

    const aggregate = new QuizSessionAggregate(quiz, 30);
    aggregate.addPlayer(player.id);
    aggregate.startQuiz();
    aggregate.endQuiz();

    expect(() => aggregate.submitAnswer('p1', 'q1', '4')).toThrow(
      'Quiz is not active.'
    );
  });
});
