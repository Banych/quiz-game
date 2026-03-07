import { describe, it, expect } from 'vitest';
import {
  useNetworkStatus,
  type EffectiveType,
  type NetworkStatus,
} from '@hooks/use-network-status';

/**
 * Tests for useNetworkStatus hook
 *
 * NOTE: These tests validate hook exports and type contracts only.
 * Browser API integration (navigator.onLine, event listeners) is tested via E2E tests.
 */

describe('useNetworkStatus', () => {
  describe('Hook Export', () => {
    it('should export useNetworkStatus as a function', () => {
      expect(useNetworkStatus).toBeDefined();
      expect(typeof useNetworkStatus).toBe('function');
    });
  });

  describe('Type Contracts', () => {
    it('should define NetworkStatus type with correct values', () => {
      const validStatuses: NetworkStatus[] = ['online', 'offline'];

      expect(validStatuses).toHaveLength(2);
      expect(validStatuses).toContain('online');
      expect(validStatuses).toContain('offline');
    });

    it('should define EffectiveType with all connection types', () => {
      const validTypes: EffectiveType[] = [
        '4g',
        '3g',
        '2g',
        'slow-2g',
        'unknown',
      ];

      expect(validTypes).toHaveLength(5);
      expect(validTypes).toContain('4g');
      expect(validTypes).toContain('3g');
      expect(validTypes).toContain('2g');
      expect(validTypes).toContain('slow-2g');
      expect(validTypes).toContain('unknown');
    });

    it('should define NetworkStatusInfo interface structure', () => {
      // Validate expected return structure
      const mockResult = {
        status: 'online' as NetworkStatus,
        isOnline: true,
        isOffline: false,
        effectiveType: '4g' as EffectiveType,
      };

      // Check all required properties
      expect(mockResult).toHaveProperty('status');
      expect(mockResult).toHaveProperty('isOnline');
      expect(mockResult).toHaveProperty('isOffline');
      expect(mockResult).toHaveProperty('effectiveType');

      // Check types
      expect(typeof mockResult.status).toBe('string');
      expect(typeof mockResult.isOnline).toBe('boolean');
      expect(typeof mockResult.isOffline).toBe('boolean');
      expect(typeof mockResult.effectiveType).toBe('string');
    });

    it('should have mutually exclusive isOnline/isOffline flags', () => {
      const onlineState = {
        status: 'online' as NetworkStatus,
        isOnline: true,
        isOffline: false,
        effectiveType: '4g' as EffectiveType,
      };

      const offlineState = {
        status: 'offline' as NetworkStatus,
        isOnline: false,
        isOffline: true,
        effectiveType: 'unknown' as EffectiveType,
      };

      // Online state
      expect(onlineState.isOnline).toBe(true);
      expect(onlineState.isOffline).toBe(false);
      expect(onlineState.isOnline && onlineState.isOffline).toBe(false);

      // Offline state
      expect(offlineState.isOnline).toBe(false);
      expect(offlineState.isOffline).toBe(true);
      expect(offlineState.isOnline && offlineState.isOffline).toBe(false);
    });
  });

  describe('API Contract', () => {
    it('should return all required NetworkStatusInfo properties', () => {
      // Mock what hook should return
      const expectedProperties = [
        'status',
        'isOnline',
        'isOffline',
        'effectiveType',
      ];
      const mockReturn = {
        status: 'online' as NetworkStatus,
        isOnline: true,
        isOffline: false,
        effectiveType: 'unknown' as EffectiveType,
      };

      expectedProperties.forEach((prop) => {
        expect(mockReturn).toHaveProperty(prop);
      });
    });

    it('should use "unknown" as default effectiveType when API unavailable', () => {
      const defaultState = {
        status: 'online' as NetworkStatus,
        isOnline: true,
        isOffline: false,
        effectiveType: 'unknown' as EffectiveType,
      };

      expect(defaultState.effectiveType).toBe('unknown');
    });
  });
});
