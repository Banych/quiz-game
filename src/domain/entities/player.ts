import { Answer } from '@domain/entities/answer';

export class Player {
  id: string;
  name: string;
  score: number;
  answers: Map<string, Answer>;
  status: 'Active' | 'Disconnected' | 'Finished';
  rank?: number;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.score = 0;
    this.answers = new Map();
    this.status = 'Active';
  }

  submitAnswer(questionId: string, answer: Answer): void {
    this.answers.set(questionId, answer);
  }

  calculateScore(): number {
    this.score = Array.from(this.answers.values())
      .filter((answer) => answer.isCorrect)
      .reduce((total, answer) => total + (answer.points || 0), 0);
    return this.score;
  }

  updateStatus(newStatus: 'Active' | 'Disconnected' | 'Finished'): void {
    this.status = newStatus;
  }
}
