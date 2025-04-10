import { Answer } from '@domain/entities/answer';
import { Player } from '@domain/entities/player';
import { describe, expect, it } from 'vitest';

describe('Player', () => {
  it('should initialize with the given id and name', () => {
    const player = new Player('1', 'John Doe');
    expect(player.id).toBe('1');
    expect(player.name).toBe('John Doe');
    expect(player.score).toBe(0);
    expect(player.status).toBe('Active');
    expect(player.answers.size).toBe(0);
  });

  it('should allow submitting an answer', () => {
    const player = new Player('1', 'John Doe');
    const answer = new Answer('1', 'q1', 'Answer', new Date());
    player.submitAnswer('q1', answer);

    expect(player.answers.size).toBe(1);
    expect(player.answers.get('q1')).toBe(answer);
  });

  it('should calculate the total score correctly', () => {
    const player = new Player('1', 'John Doe');
    const answer1 = new Answer('1', 'q1', 'Answer1', new Date());
    answer1.markCorrect(10);
    const answer2 = new Answer('1', 'q2', 'Answer2', new Date());
    answer2.markCorrect(5);

    player.submitAnswer('q1', answer1);
    player.submitAnswer('q2', answer2);

    expect(player.calculateScore()).toBe(15);
  });

  it('should update the player status', () => {
    const player = new Player('1', 'John Doe');
    player.updateStatus('Disconnected');
    expect(player.status).toBe('Disconnected');

    player.updateStatus('Finished');
    expect(player.status).toBe('Finished');
  });

  it('should handle incorrect answers in the score calculation', () => {
    const player = new Player('1', 'John Doe');
    const answer1 = new Answer('1', 'q1', 'Answer1', new Date());
    answer1.markCorrect(10);
    const answer2 = new Answer('1', 'q2', 'Answer2', new Date());
    answer2.markIncorrect();

    player.submitAnswer('q1', answer1);
    player.submitAnswer('q2', answer2);

    expect(player.calculateScore()).toBe(10);
  });
});
