import { Score } from '@domain/value-objects/score';
import { describe, expect, it } from 'vitest';

describe('Score', () => {
  it('should initialize with a default value of 0', () => {
    const score = new Score();
    expect(score.value).toBe(0);
  });

  it('should initialize with a custom value', () => {
    const score = new Score(10);
    expect(score.value).toBe(10);
  });

  it('should add points correctly', () => {
    const score = new Score();
    score.add(5);
    expect(score.value).toBe(5);
  });

  it('should subtract points correctly', () => {
    const score = new Score(10);
    score.subtract(4);
    expect(score.value).toBe(6);
  });

  it('should not allow the score to go below 0', () => {
    const score = new Score(5);
    score.subtract(10);
    expect(score.value).toBe(0);
  });

  it('should reset the score to 0', () => {
    const score = new Score(10);
    score.reset();
    expect(score.value).toBe(0);
  });
});
