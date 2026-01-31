import type { PlayerDTO } from '@application/dtos/player.dto';
import type { ConnectionStatusDTO } from '@application/dtos/player.dto';

/**
 * PresenceMonitor Service
 *
 * Business logic for determining player connection status based on:
 * - player.lastSeenAt timestamp (from domain entity)
 * - Current time
 * - Configurable thresholds (connected: 30s, away: 120s)
 *
 * Note: We use the same thresholds as ConnectionStatus value object
 * for consistency across the application.
 */
export class PresenceMonitor {
  private readonly CONNECTED_THRESHOLD_MS = 30_000; // 30 seconds
  private readonly DISCONNECTED_THRESHOLD_MS = 120_000; // 2 minutes

  /**
   * Determine connection status for a single player
   * - connected: lastSeenAt within 30s
   * - away: lastSeenAt between 30s and 120s
   * - disconnected: lastSeenAt beyond 120s or null
   */
  getPlayerConnectionStatus(
    player: PlayerDTO,
    now: Date = new Date()
  ): ConnectionStatusDTO {
    if (!player.lastSeenAt) {
      return 'disconnected';
    }

    const lastSeen = new Date(player.lastSeenAt);
    const timeSinceLastSeen = now.getTime() - lastSeen.getTime();

    if (timeSinceLastSeen <= this.CONNECTED_THRESHOLD_MS) {
      return 'connected';
    }

    if (timeSinceLastSeen <= this.DISCONNECTED_THRESHOLD_MS) {
      return 'away';
    }

    return 'disconnected';
  }

  /**
   * Aggregate connection status for multiple players
   * Returns a map of playerId -> connectionStatus
   */
  aggregatePlayerStatus(
    players: PlayerDTO[],
    now: Date = new Date()
  ): Map<string, ConnectionStatusDTO> {
    return new Map(
      players.map((player) => [
        player.id,
        this.getPlayerConnectionStatus(player, now),
      ])
    );
  }

  /**
   * Get summary statistics for a group of players
   * Useful for displaying host dashboard info
   */
  getStatusSummary(
    players: PlayerDTO[],
    now: Date = new Date()
  ): { connected: number; away: number; disconnected: number } {
    const statuses = this.aggregatePlayerStatus(players, now);
    const summary = {
      connected: 0,
      away: 0,
      disconnected: 0,
    };

    for (const status of statuses.values()) {
      if (status === 'connected') summary.connected++;
      else if (status === 'away') summary.away++;
      else summary.disconnected++;
    }

    return summary;
  }
}
