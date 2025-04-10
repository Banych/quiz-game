export class PlayerAnsweredEvent {
  playerId: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timestamp: Date;

  constructor(
    playerId: string,
    questionId: string,
    answer: string,
    isCorrect: boolean,
    timestamp: Date
  ) {
    this.playerId = playerId;
    this.questionId = questionId;
    this.answer = answer;
    this.isCorrect = isCorrect;
    this.timestamp = timestamp;
  }
}
