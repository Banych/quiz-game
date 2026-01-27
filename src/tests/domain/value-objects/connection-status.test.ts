import {
  ConnectionStatus,
  CONNECTED_THRESHOLD_MS,
  DISCONNECTED_THRESHOLD_MS,
} from '@domain/value-objects/connection-status';
import { describe, expect, it } from 'vitest';

describe('ConnectionStatus', () => {
  describe('fromLastSeenAt', () => {
    it('should return connected when lastSeenAt is within threshold', () => {
      const now = new Date();
      const lastSeenAt = new Date(now.getTime() - 10_000); // 10 seconds ago

      const status = ConnectionStatus.fromLastSeenAt(lastSeenAt, now);

      expect(status.status).toBe('connected');
      expect(status.isConnected()).toBe(true);
      expect(status.isAway()).toBe(false);
      expect(status.isDisconnected()).toBe(false);
    });

    it('should return connected when lastSeenAt is exactly at threshold', () => {
      const now = new Date();
      const lastSeenAt = new Date(now.getTime() - CONNECTED_THRESHOLD_MS);

      const status = ConnectionStatus.fromLastSeenAt(lastSeenAt, now);

      expect(status.status).toBe('connected');
    });

    it('should return away when lastSeenAt is between 30s and 2min', () => {
      const now = new Date();
      const lastSeenAt = new Date(now.getTime() - 60_000); // 1 minute ago

      const status = ConnectionStatus.fromLastSeenAt(lastSeenAt, now);

      expect(status.status).toBe('away');
      expect(status.isAway()).toBe(true);
      expect(status.isConnected()).toBe(false);
      expect(status.isDisconnected()).toBe(false);
    });

    it('should return disconnected when lastSeenAt is beyond 2min', () => {
      const now = new Date();
      const lastSeenAt = new Date(now.getTime() - 180_000); // 3 minutes ago

      const status = ConnectionStatus.fromLastSeenAt(lastSeenAt, now);

      expect(status.status).toBe('disconnected');
      expect(status.isDisconnected()).toBe(true);
      expect(status.isConnected()).toBe(false);
      expect(status.isAway()).toBe(false);
    });

    it('should return disconnected when lastSeenAt is exactly at disconnected threshold', () => {
      const now = new Date();
      const lastSeenAt = new Date(
        now.getTime() - DISCONNECTED_THRESHOLD_MS - 1
      );

      const status = ConnectionStatus.fromLastSeenAt(lastSeenAt, now);

      expect(status.status).toBe('disconnected');
    });

    it('should return disconnected when lastSeenAt is null', () => {
      const status = ConnectionStatus.fromLastSeenAt(null);

      expect(status.status).toBe('disconnected');
      expect(status.lastSeenAt).toBeNull();
    });
  });

  describe('static factory methods', () => {
    it('should create connected status with current time', () => {
      const before = new Date();
      const status = ConnectionStatus.connected();
      const after = new Date();

      expect(status.status).toBe('connected');
      expect(status.lastSeenAt).not.toBeNull();
      expect(status.lastSeenAt!.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(status.lastSeenAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should create connected status with specific time', () => {
      const specificTime = new Date('2024-01-15T12:00:00Z');
      const status = ConnectionStatus.connected(specificTime);

      expect(status.status).toBe('connected');
      expect(status.lastSeenAt).toEqual(specificTime);
    });

    it('should create disconnected status with null lastSeenAt', () => {
      const status = ConnectionStatus.disconnected();

      expect(status.status).toBe('disconnected');
      expect(status.lastSeenAt).toBeNull();
    });

    it('should create disconnected status with specific lastSeenAt', () => {
      const specificTime = new Date('2024-01-15T12:00:00Z');
      const status = ConnectionStatus.disconnected(specificTime);

      expect(status.status).toBe('disconnected');
      expect(status.lastSeenAt).toEqual(specificTime);
    });
  });

  describe('getTimeSinceLastSeen', () => {
    it('should return null when lastSeenAt is null', () => {
      const status = ConnectionStatus.disconnected();

      expect(status.getTimeSinceLastSeen()).toBeNull();
    });

    it('should return "Just now" for less than 60 seconds', () => {
      const now = new Date();
      const lastSeenAt = new Date(now.getTime() - 30_000); // 30 seconds ago
      const status = ConnectionStatus.fromLastSeenAt(lastSeenAt, now);

      expect(status.getTimeSinceLastSeen(now)).toBe('Just now');
    });

    it('should return "1 minute ago" for exactly 1 minute', () => {
      const now = new Date();
      const lastSeenAt = new Date(now.getTime() - 60_000);
      const status = ConnectionStatus.fromLastSeenAt(lastSeenAt, now);

      expect(status.getTimeSinceLastSeen(now)).toBe('1 minute ago');
    });

    it('should return "5 minutes ago" for 5 minutes', () => {
      const now = new Date();
      const lastSeenAt = new Date(now.getTime() - 300_000);
      const status = ConnectionStatus.fromLastSeenAt(lastSeenAt, now);

      expect(status.getTimeSinceLastSeen(now)).toBe('5 minutes ago');
    });

    it('should return "1 hour ago" for exactly 1 hour', () => {
      const now = new Date();
      const lastSeenAt = new Date(now.getTime() - 3_600_000);
      const status = ConnectionStatus.fromLastSeenAt(lastSeenAt, now);

      expect(status.getTimeSinceLastSeen(now)).toBe('1 hour ago');
    });

    it('should return "2 hours ago" for 2 hours', () => {
      const now = new Date();
      const lastSeenAt = new Date(now.getTime() - 7_200_000);
      const status = ConnectionStatus.fromLastSeenAt(lastSeenAt, now);

      expect(status.getTimeSinceLastSeen(now)).toBe('2 hours ago');
    });
  });
});
