import { PlayerAnsweredEvent } from '@domain/events/player-answered-event';
import { QuizEndedEvent } from '@domain/events/quiz-ended-event';
import { QuizStartedEvent } from '@domain/events/quiz-start-event';
import { describe, expect, it } from 'vitest';

describe('Domain Events', () => {
  it('should initialize QuizStartedEvent with the correct attributes', () => {
    const startTime = new Date();
    const event = new QuizStartedEvent('quiz1', startTime);

    expect(event.quizId).toBe('quiz1');
    expect(event.startTime).toBe(startTime);
  });

  it('should initialize QuizEndedEvent with the correct attributes', () => {
    const endTime = new Date();
    const event = new QuizEndedEvent('quiz1', endTime);

    expect(event.quizId).toBe('quiz1');
    expect(event.endTime).toBe(endTime);
  });

  it('should initialize PlayerAnsweredEvent with the correct attributes', () => {
    const timestamp = new Date();
    const event = new PlayerAnsweredEvent(
      'player1',
      'question1',
      'Answer',
      true,
      timestamp
    );

    expect(event.playerId).toBe('player1');
    expect(event.questionId).toBe('question1');
    expect(event.answer).toBe('Answer');
    expect(event.isCorrect).toBe(true);
    expect(event.timestamp).toBe(timestamp);
  });
});
