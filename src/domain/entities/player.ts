export enum PlayerStatus {
  Active = 'Active',
  Disconnected = 'Disconnected',
  Finished = 'Finished',
}

export class Player {
  id: string;
  name: string;
  quizId: string;
  status: PlayerStatus;
  score: number;
  rank?: number;

  constructor(id: string, name: string, quizId: string) {
    this.id = id;
    this.name = name;
    this.quizId = quizId;
    this.status = PlayerStatus.Active;
    this.score = 0;
  }

  updateStatus(newStatus: PlayerStatus): void {
    this.status = newStatus;
  }

  updateScore(newScore: number): void {
    this.score = newScore;
  }

  updateRank(newRank?: number | null): void {
    this.rank = newRank ?? undefined;
  }
}
