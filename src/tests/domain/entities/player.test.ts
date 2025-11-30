import { Player, PlayerStatus } from '@domain/entities/player';
import { describe, expect, it } from 'vitest';

describe('Player', () => {
  it('should initialize with the given id and name', () => {
    const player = new Player('1', 'John Doe', 'quiz-1');
    expect(player.id).toBe('1');
    expect(player.name).toBe('John Doe');
    expect(player.status).toBe(PlayerStatus.Active);
  });

  it('should update the player status', () => {
    const player = new Player('1', 'John Doe', 'quiz-1');
    player.updateStatus(PlayerStatus.Disconnected);
    expect(player.status).toBe('Disconnected');

    player.updateStatus(PlayerStatus.Finished);
    expect(player.status).toBe(PlayerStatus.Finished);
  });

  it('should update score and rank', () => {
    const player = new Player('1', 'John Doe', 'quiz-1');
    expect(player.score).toBe(0);

    player.updateScore(25);
    player.updateRank(2);

    expect(player.score).toBe(25);
    expect(player.rank).toBe(2);

    player.updateRank(null);
    expect(player.rank).toBeUndefined();
  });
});
