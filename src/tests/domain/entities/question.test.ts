import { Question } from '@domain/entities/question';
import { describe, expect, it } from 'vitest';

describe('Question', () => {
  it('should initialize with the given attributes', () => {
    const question = new Question(
      'q1',
      'What is the capital of France?',
      ['Paris', 'paris'],
      'text',
      10
    );

    expect(question.id).toBe('q1');
    expect(question.text).toBe('What is the capital of France?');
    expect(question.correctAnswers).toEqual(['Paris', 'paris']);
    expect(question.type).toBe('text');
    expect(question.points).toBe(10);
    expect(question.media).toBeUndefined();
    expect(question.mediaType).toBeUndefined();
    expect(question.options).toBeUndefined();
  });

  it('should validate correct answers', () => {
    const question = new Question(
      'q1',
      'What is the capital of France?',
      ['Paris', 'paris'],
      'text',
      10
    );

    expect(question.validateAnswer('Paris')).toBe(true);
    expect(question.validateAnswer('paris')).toBe(true);
  });

  it('should invalidate incorrect answers', () => {
    const question = new Question(
      'q1',
      'What is the capital of France?',
      ['Paris', 'paris'],
      'text',
      10
    );

    expect(question.validateAnswer('London')).toBe(false);
    expect(question.validateAnswer('')).toBe(false);
  });

  it('should randomize options for multiple-choice questions', () => {
    const question = new Question(
      'q1',
      'What is the capital of France?',
      ['Paris', 'paris'],
      'multiple-choice',
      10,
      undefined,
      undefined,
      ['Paris', 'London', 'Berlin', 'Madrid']
    );

    const originalOptions = [...question.options!];
    question.randomizeOptions();

    expect(question.options).not.toEqual(originalOptions);
    expect(question.options!.sort()).toEqual(originalOptions.sort());
  });
});
