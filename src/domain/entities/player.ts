export enum PlayerStatus {
  Active = 'Active',
  Disconnected = 'Disconnected',
  Finished = 'Finished',
}

export class Player {
  id: string;
  name: string;
  status: PlayerStatus;
  rank?: number;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.status = PlayerStatus.Active;
  }

  updateStatus(newStatus: PlayerStatus): void {
    this.status = newStatus;
  }
}
