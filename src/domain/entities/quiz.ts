import { Question } from '@domain/entities/question';
import { Answer } from '@domain/entities/answer';

export enum QuizStatus {
  Active = 'Active',
  Pending = 'Pending',
  Completed = 'Completed',
}

export class Quiz {
  id: string;
  title: string;
  questions: Question[];
  players: Set<string>;
  status: QuizStatus;
  currentQuestionIndex: number;
  startTime?: Date;
  endTime?: Date;
  settings: QuizSettings;
  answers: Map<string, Answer[]>;

  constructor(
    id: string,
    title: string,
    questions: Question[],
    settings: QuizSettings
  ) {
    this.id = id;
    this.title = title;
    this.questions = questions;
    this.players = new Set();
    this.status = QuizStatus.Pending;
    this.currentQuestionIndex = 0;
    this.settings = settings;
    this.answers = new Map();
  }

  startQuiz(): void {
    if (this.status !== QuizStatus.Pending) {
      throw new Error('Quiz can only be started if it is in Pending status.');
    }
    this.status = QuizStatus.Active;
    this.startTime = new Date();
  }

  endQuiz(): void {
    if (this.status !== QuizStatus.Active) {
      throw new Error('Quiz can only be ended if it is in Active status.');
    }
    this.status = QuizStatus.Completed;
    this.endTime = new Date();
  }

  addPlayer(playerId: string): void {
    this.players.add(playerId);
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
    this.answers.delete(playerId);
  }

  submitAnswer(playerId: string, answer: Answer): void {
    if (!this.players.has(playerId)) {
      throw new Error('Player is not part of this quiz.');
    }

    if (!this.answers.has(playerId)) {
      this.answers.set(playerId, []);
    }

    this.answers.get(playerId)!.push(answer);
  }

  calculateScores(): Map<string, number> {
    const scores = new Map<string, number>();

    for (const [playerId, answers] of this.answers.entries()) {
      const totalScore = answers
        .filter((answer) => answer.isCorrect)
        .reduce((sum, answer) => sum + (answer.points || 0), 0);
      scores.set(playerId, totalScore);
    }

    return scores;
  }

  nextQuestion(): Question | null {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      return this.questions[this.currentQuestionIndex];
    }
    return null;
  }
}

export interface QuizSettings {
  timePerQuestion: number;
  allowSkipping: boolean;
}
