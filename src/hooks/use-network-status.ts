import { useState, useEffect } from 'react';

export type NetworkStatus = 'online' | 'offline';
export type EffectiveType = '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';

export interface NetworkStatusInfo {
  status: NetworkStatus;
  isOnline: boolean;
  isOffline: boolean;
  effectiveType: EffectiveType;
}

/**
 * Hook that monitors browser network connectivity status.
 *
 * Detects:
 * - Online/offline transitions via navigator.onLine
 * - Network connection type via NetworkInformation API (when available)
 *
 * @returns NetworkStatusInfo with status, flags, and effective connection type
 *
 * @example
 * const { isOnline, effectiveType } = useNetworkStatus();
 * if (!isOnline) {
 *   return <OfflineBanner />;
 * }
 */
export function useNetworkStatus(): NetworkStatusInfo {
  const [status, setStatus] = useState<NetworkStatus>(
    typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline'
  );
  const [effectiveType, setEffectiveType] = useState<EffectiveType>('unknown');

  useEffect(() => {
    // Update effective connection type if NetworkInformation API available
    const updateConnectionType = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const type = connection?.effectiveType;
        if (type && ['4g', '3g', '2g', 'slow-2g'].includes(type)) {
          setEffectiveType(type);
        } else {
          setEffectiveType('unknown');
        }
      }
    };

    const handleOnline = () => {
      setStatus('online');
      updateConnectionType();
    };

    const handleOffline = () => {
      setStatus('offline');
    };

    // Initial connection type check
    updateConnectionType();

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener?.('change', updateConnectionType);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection?.removeEventListener?.('change', updateConnectionType);
      }
    };
  }, []);

  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    effectiveType,
  };
}
