import { Player } from '@domain/entities/player';
import { Question } from '@domain/entities/question';
import { Quiz, QuizStatus } from '@domain/entities/quiz';
import { describe, expect, it } from 'vitest';

describe('Quiz', () => {
  it('should initialize with the given attributes', () => {
    const questions = [new Question('q1', 'What is 2 + 2?', ['4'], 'text', 10)];
    const quiz = new Quiz('quiz1', 'Math Quiz', questions, {
      timePerQuestion: 30,
      allowSkipping: true,
    });

    expect(quiz.id).toBe('quiz1');
    expect(quiz.title).toBe('Math Quiz');
    expect(quiz.questions).toHaveLength(1);
    expect(quiz.players).toHaveLength(0);
    expect(quiz.status).toBe(QuizStatus.Pending);
    expect(quiz.currentQuestionIndex).toBe(0);
    expect(quiz.settings.timePerQuestion).toBe(30);
    expect(quiz.settings.allowSkipping).toBe(true);
  });

  it('should start the quiz', () => {
    const quiz = new Quiz('quiz1', 'Math Quiz', [], {
      timePerQuestion: 30,
      allowSkipping: true,
    });

    quiz.startQuiz();

    expect(quiz.status).toBe(QuizStatus.Active);
    expect(quiz.startTime).toBeDefined();
  });

  it('should throw an error if starting a quiz that is not in Pending status', () => {
    const quiz = new Quiz('quiz1', 'Math Quiz', [], {
      timePerQuestion: 30,
      allowSkipping: true,
    });

    quiz.startQuiz();

    expect(() => quiz.startQuiz()).toThrow(
      'Quiz can only be started if it is in Pending status.'
    );
  });

  it('should end the quiz', () => {
    const quiz = new Quiz('quiz1', 'Math Quiz', [], {
      timePerQuestion: 30,
      allowSkipping: true,
    });

    quiz.startQuiz();
    quiz.endQuiz();

    expect(quiz.status).toBe(QuizStatus.Completed);
    expect(quiz.endTime).toBeDefined();
  });

  it('should throw an error if ending a quiz that is not in Active status', () => {
    const quiz = new Quiz('quiz1', 'Math Quiz', [], {
      timePerQuestion: 30,
      allowSkipping: true,
    });

    expect(() => quiz.endQuiz()).toThrow(
      'Quiz can only be ended if it is in Active status.'
    );
  });

  it('should add a player to the quiz', () => {
    const quiz = new Quiz('quiz1', 'Math Quiz', [], {
      timePerQuestion: 30,
      allowSkipping: true,
    });

    const player = new Player('p1', 'John Doe');
    quiz.addPlayer(player);

    expect(quiz.players).toHaveLength(1);
    expect(quiz.players[0]).toBe(player);
  });

  it('should remove a player from the quiz', () => {
    const quiz = new Quiz('quiz1', 'Math Quiz', [], {
      timePerQuestion: 30,
      allowSkipping: true,
    });

    const player = new Player('p1', 'John Doe');
    quiz.addPlayer(player);
    quiz.removePlayer('p1');

    expect(quiz.players).toHaveLength(0);
  });

  it('should move to the next question', () => {
    const questions = [
      new Question('q1', 'What is 2 + 2?', ['4'], 'text', 10),
      new Question('q2', 'What is 3 + 3?', ['6'], 'text', 10),
    ];
    const quiz = new Quiz('quiz1', 'Math Quiz', questions, {
      timePerQuestion: 30,
      allowSkipping: true,
    });

    const nextQuestion = quiz.nextQuestion();

    expect(quiz.currentQuestionIndex).toBe(1);
    expect(nextQuestion).toBe(questions[1]);
  });

  it('should return null if there are no more questions', () => {
    const questions = [new Question('q1', 'What is 2 + 2?', ['4'], 'text', 10)];
    const quiz = new Quiz('quiz1', 'Math Quiz', questions, {
      timePerQuestion: 30,
      allowSkipping: true,
    });

    quiz.nextQuestion();
    const nextQuestion = quiz.nextQuestion();

    expect(nextQuestion).toBeNull();
  });
});
