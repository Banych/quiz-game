import { Player } from '@/domain/entities/player';
import { Question } from '@/domain/entities/question';

export class Quiz {
  id: string;
  title: string;
  questions: Question[];
  players: Player[];
  status: 'Pending' | 'Active' | 'Completed';
  currentQuestionIndex: number;
  startTime?: Date;
  endTime?: Date;
  settings: QuizSettings;

  constructor(
    id: string,
    title: string,
    questions: Question[],
    settings: QuizSettings
  ) {
    this.id = id;
    this.title = title;
    this.questions = questions;
    this.players = [];
    this.status = 'Pending';
    this.currentQuestionIndex = 0;
    this.settings = settings;
  }

  startQuiz(): void {
    if (this.status !== 'Pending') {
      throw new Error('Quiz can only be started if it is in Pending status.');
    }
    this.status = 'Active';
    this.startTime = new Date();
  }

  endQuiz(): void {
    if (this.status !== 'Active') {
      throw new Error('Quiz can only be ended if it is in Active status.');
    }
    this.status = 'Completed';
    this.endTime = new Date();
  }

  addPlayer(player: Player): void {
    this.players.push(player);
  }

  removePlayer(playerId: string): void {
    this.players = this.players.filter((player) => player.id !== playerId);
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
