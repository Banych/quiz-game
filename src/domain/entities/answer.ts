export class Answer {
  playerId: string;
  questionId: string;
  value: string;
  timestamp: Date;
  isCorrect?: boolean;
  points?: number;
  timeTaken?: number;

  constructor(
    playerId: string,
    questionId: string,
    value: string,
    timestamp: Date,
    timeTaken?: number
  ) {
    this.playerId = playerId;
    this.questionId = questionId;
    this.value = value;
    this.timestamp = timestamp;
    this.timeTaken = timeTaken;
  }

  markCorrect(points: number): void {
    this.isCorrect = true;
    this.points = points;
  }

  markIncorrect(): void {
    this.isCorrect = false;
    this.points = 0;
  }
}
