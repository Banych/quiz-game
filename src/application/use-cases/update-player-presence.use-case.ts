import type { IPlayerRepository } from '@domain/repositories/player-repository';

export type UpdatePlayerPresenceInput = {
  playerId: string;
  timestamp?: Date;
};

export type UpdatePlayerPresenceResult = {
  success: boolean;
  lastSeenAt: Date;
};

/**
 * Updates the player's lastSeenAt timestamp to track presence.
 * Called when a player sends a presence heartbeat.
 */
export class UpdatePlayerPresenceUseCase {
  constructor(private readonly playerRepository: IPlayerRepository) {}

  async execute(
    input: UpdatePlayerPresenceInput
  ): Promise<UpdatePlayerPresenceResult> {
    const { playerId, timestamp = new Date() } = input;

    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    player.updateLastSeenAt(timestamp);
    await this.playerRepository.updateLastSeenAt(playerId, timestamp);

    return {
      success: true,
      lastSeenAt: timestamp,
    };
  }
}
