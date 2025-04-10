export class QuizStartedEvent {
  quizId: string;
  startTime: Date;

  constructor(quizId: string, startTime: Date) {
    this.quizId = quizId;
    this.startTime = startTime;
  }
}
