import { Timer } from '@domain/value-objects/timer';
import { describe, expect, it, vi } from 'vitest';

describe('Timer', () => {
  it('should initialize with the given duration', () => {
    const timer = new Timer(60);
    expect(timer.duration).toBe(60);
  });

  it('should start the timer and set startTime and endTime', () => {
    const timer = new Timer(60);
    timer.start();

    expect(timer.startTime).toBeDefined();
    expect(timer.endTime).toBeDefined();
    expect(timer.endTime!.getTime()).toBe(
      timer.startTime!.getTime() + 60 * 1000
    );
  });

  it('should calculate the remaining time correctly', () => {
    const timer = new Timer(10);
    timer.start();

    const now = new Date(timer.startTime!.getTime() + 5 * 1000);
    vi.setSystemTime(now);

    expect(timer.getRemainingTime()).toBe(5);
  });

  it('should return 0 remaining time if the timer has expired', () => {
    const timer = new Timer(10);
    timer.start();

    const now = new Date(timer.startTime!.getTime() + 15 * 1000);
    vi.setSystemTime(now);

    expect(timer.getRemainingTime()).toBe(0);
  });

  it('should throw an error if getRemainingTime is called before starting the timer', () => {
    const timer = new Timer(10);
    expect(() => timer.getRemainingTime()).toThrow(
      'Timer has not been started.'
    );
  });

  it('should correctly identify if the timer has expired', () => {
    const timer = new Timer(10);
    timer.start();

    const now = new Date(timer.startTime!.getTime() + 15 * 1000);
    vi.setSystemTime(now);

    expect(timer.hasExpired()).toBe(true);
  });

  it('should correctly identify if the timer has not expired', () => {
    const timer = new Timer(10);
    timer.start();

    const now = new Date(timer.startTime!.getTime() + 5 * 1000);
    vi.setSystemTime(now);

    expect(timer.hasExpired()).toBe(false);
  });
});
