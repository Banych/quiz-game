/**
 * Thresholds for determining connection status based on lastSeenAt timestamp.
 * - Connected: presence within CONNECTED_THRESHOLD_MS
 * - Away: no presence between CONNECTED_THRESHOLD_MS and DISCONNECTED_THRESHOLD_MS
 * - Disconnected: no presence beyond DISCONNECTED_THRESHOLD_MS
 */
export const CONNECTED_THRESHOLD_MS = 30_000; // 30 seconds
export const DISCONNECTED_THRESHOLD_MS = 120_000; // 2 minutes

export type ConnectionStatusType = 'connected' | 'away' | 'disconnected';

export class ConnectionStatus {
  readonly status: ConnectionStatusType;
  readonly lastSeenAt: Date | null;

  private constructor(status: ConnectionStatusType, lastSeenAt: Date | null) {
    this.status = status;
    this.lastSeenAt = lastSeenAt;
  }

  /**
   * Creates a ConnectionStatus from a lastSeenAt timestamp.
   * Compares against current time to determine status.
   */
  static fromLastSeenAt(
    lastSeenAt: Date | null,
    now: Date = new Date()
  ): ConnectionStatus {
    if (!lastSeenAt) {
      return new ConnectionStatus('disconnected', null);
    }

    const elapsedMs = now.getTime() - lastSeenAt.getTime();

    if (elapsedMs <= CONNECTED_THRESHOLD_MS) {
      return new ConnectionStatus('connected', lastSeenAt);
    }

    if (elapsedMs <= DISCONNECTED_THRESHOLD_MS) {
      return new ConnectionStatus('away', lastSeenAt);
    }

    return new ConnectionStatus('disconnected', lastSeenAt);
  }

  /**
   * Creates a connected status (for newly joined or just-seen players).
   */
  static connected(lastSeenAt: Date = new Date()): ConnectionStatus {
    return new ConnectionStatus('connected', lastSeenAt);
  }

  /**
   * Creates a disconnected status.
   */
  static disconnected(lastSeenAt: Date | null = null): ConnectionStatus {
    return new ConnectionStatus('disconnected', lastSeenAt);
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }

  isAway(): boolean {
    return this.status === 'away';
  }

  isDisconnected(): boolean {
    return this.status === 'disconnected';
  }

  /**
   * Returns human-readable time since last seen.
   */
  getTimeSinceLastSeen(now: Date = new Date()): string | null {
    if (!this.lastSeenAt) {
      return null;
    }

    const elapsedMs = now.getTime() - this.lastSeenAt.getTime();
    const seconds = Math.floor(elapsedMs / 1000);

    if (seconds < 60) {
      return 'Just now';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }

    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
}
