export class Timer {
  duration: number;
  startTime?: Date;
  endTime?: Date;

  constructor(duration: number) {
    this.duration = duration;
  }

  start(): void {
    this.startTime = new Date();
    this.endTime = new Date(this.startTime.getTime() + this.duration * 1000);
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
