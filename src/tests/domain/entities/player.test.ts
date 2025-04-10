import { Answer } from '@domain/entities/answer';
import { Player, PlayerStatus } from '@domain/entities/player';
import { describe, expect, it } from 'vitest';

describe('Player', () => {
  it('should initialize with the given id and name', () => {
    const player = new Player('1', 'John Doe');
    expect(player.id).toBe('1');
    expect(player.name).toBe('John Doe');
    expect(player.status).toBe(PlayerStatus.Active);
  });

  it('should update the player status', () => {
    const player = new Player('1', 'John Doe');
    player.updateStatus(PlayerStatus.Disconnected);
    expect(player.status).toBe('Disconnected');

    player.updateStatus(PlayerStatus.Finished);
    expect(player.status).toBe(PlayerStatus.Finished);
  });
});
