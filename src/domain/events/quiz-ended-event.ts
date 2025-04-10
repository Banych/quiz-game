export class QuizEndedEvent {
  quizId: string;
  endTime: Date;

  constructor(quizId: string, endTime: Date) {
    this.quizId = quizId;
    this.endTime = endTime;
  }
}
