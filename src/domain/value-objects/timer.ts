type TimerOptions = {
  startTime?: Date;
  endTime?: Date;
};

export class Timer {
  duration: number;
  startTime?: Date;
  endTime?: Date;

  constructor(duration: number, options?: TimerOptions) {
    this.duration = duration;

    if (options?.startTime) {
      this.resume(options.startTime, options.endTime);
    }
  }

  start(startAt: Date = new Date()): void {
    this.resume(startAt);
  }

  resume(startAt: Date, endAt?: Date): void {
    this.startTime = startAt;
    this.endTime =
      endAt ?? new Date(this.startTime.getTime() + this.duration * 1000);
  }

  getRemainingTime(): number {
    if (!this.startTime || !this.endTime) {
      throw new Error('Timer has not been started.');
    }
    const now = new Date();
    return Math.max(
      0,
      Math.floor((this.endTime.getTime() - now.getTime()) / 1000)
    );
  }

  hasExpired(): boolean {
    return this.getRemainingTime() === 0;
  }
}
