export class Score {
  value: number;

  constructor(initialValue: number = 0) {
    this.value = initialValue;
  }

  add(points: number): void {
    this.value += points;
  }

  subtract(points: number): void {
    this.value = Math.max(0, this.value - points);
  }

  reset(): void {
    this.value = 0;
  }
}
