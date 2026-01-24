export class QuestionLockedEvent {
  constructor(
    public readonly quizId: string,
    public readonly questionId: string,
    public readonly questionIndex: number,
    public readonly lockedAt: Date = new Date()
  ) {}
}
