'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNetworkStatus } from './use-network-status';
import { usePresence, type UsePresenceReturn } from './use-presence';
import { playerSessionQueryKey } from './use-player-session';
import type { PlayerSessionDTO } from '@application/dtos/player-session.dto';

export type ReconnectionState =
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'failed';

export interface UseReconnectionOptions {
  quizId: string;
  playerId: string;
  playerName: string;
  /** Whether to enable auto-reconnection when network returns */
  autoReconnect?: boolean;
  /** Whether to persist presence to database */
  persistToDatabase?: boolean;
  /** Called when disconnection is detected */
  onDisconnected?: () => void;
  /** Called when reconnection succeeds */
  onReconnected?: () => void;
  /** Called when reconnection fails */
  onFailed?: () => void;
}

export interface UseReconnectionReturn {
  /** Current reconnection state */
  state: ReconnectionState;
  /** Whether disconnected */
  isDisconnected: boolean;
  /** Whether reconnecting */
  isReconnecting: boolean;
  /** Whether connection failed */
  isFailed: boolean;
  /** Manually trigger reconnection */
  reconnect: () => Promise<void>;
  /** Presence hook return value */
  presence: UsePresenceReturn;
}

/**
 * Hook that orchestrates player reconnection flow.
 *
 * Monitors:
 * - Browser online/offline events via useNetworkStatus
 * - Presence heartbeat failures via usePresence
 *
 * Auto-reconnects when:
 * - Network returns (online event)
 * - Presence failures exceed threshold
 *
 * Reconnection flow:
 * 1. Detect offline (network or presence failure)
 * 2. Set state to 'disconnected'
 * 3. Wait for network return
 * 4. Call /sync endpoint to restore session
 * 5. Update TanStack Query cache
 * 6. Resume presence heartbeats
 *
 * @example
 * const { state, reconnect, presence } = useReconnection({
 *   quizId: '123',
 *   playerId: '456',
 *   playerName: 'Alice'
 * });
 *
 * if (state === 'disconnected') {
 *   return <OfflineBanner />;
 * }
 */
export function useReconnection({
  quizId,
  playerId,
  playerName,
  autoReconnect = true,
  persistToDatabase = false,
  onDisconnected,
  onReconnected,
  onFailed,
}: UseReconnectionOptions): UseReconnectionReturn {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const [state, setState] = useState<ReconnectionState>('connected');
  const reconnectAttemptRef = useRef<Promise<void> | null>(null);
  const lastOnlineRef = useRef<boolean>(isOnline);

  // Sync endpoint call
  const syncSession = useCallback(async (): Promise<PlayerSessionDTO> => {
    const response = await fetch(
      `/api/quiz/${quizId}/player/${playerId}/sync`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      const { error } = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(error ?? 'Failed to sync session');
    }

    return (await response.json()) as PlayerSessionDTO;
  }, [quizId, playerId]);

  // Manual reconnection function
  const reconnect = useCallback(async () => {
    // Prevent concurrent reconnection attempts
    if (reconnectAttemptRef.current) {
      return reconnectAttemptRef.current;
    }

    setState('reconnecting');

    const attemptPromise = (async () => {
      try {
        // Call sync endpoint
        const sessionData = await syncSession();

        // Update TanStack Query cache
        const queryKey = playerSessionQueryKey(quizId, playerId);
        queryClient.setQueryData<PlayerSessionDTO>(queryKey, sessionData);

        // Success
        setState('connected');
        onReconnected?.();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[useReconnection] Sync failed:', error);
        }
        setState('failed');
        onFailed?.();
      } finally {
        reconnectAttemptRef.current = null;
      }
    })();

    reconnectAttemptRef.current = attemptPromise;
    return attemptPromise;
  }, [syncSession, quizId, playerId, queryClient, onReconnected, onFailed]);

  // Auto-reconnect when network returns
  useEffect(() => {
    if (!autoReconnect) return;

    const wasOffline = !lastOnlineRef.current;
    const isNowOnline = isOnline;

    // Detect online transition (offline → online)
    if (wasOffline && isNowOnline && state === 'disconnected') {
      void reconnect();
    }

    lastOnlineRef.current = isOnline;
  }, [isOnline, state, autoReconnect, reconnect]);

  // Monitor network status for offline detection
  useEffect(() => {
    if (!isOnline && state === 'connected') {
      setState('disconnected');
      onDisconnected?.();
    }
  }, [isOnline, state, onDisconnected]);

  // Presence callbacks
  const handlePresenceError = useCallback(() => {
    if (state === 'connected') {
      setState('disconnected');
      onDisconnected?.();
    }
  }, [state, onDisconnected]);

  const handlePresenceReconnected = useCallback(() => {
    // Don't override reconnecting/failed states
    if (state === 'disconnected') {
      setState('connected');
      onReconnected?.();
    }
  }, [state, onReconnected]);

  // Initialize presence
  const presence = usePresence({
    quizId,
    playerId,
    playerName,
    persistToDatabase,
    onConnectionError: handlePresenceError,
    onReconnected: handlePresenceReconnected,
  });

  return {
    state,
    isDisconnected: state === 'disconnected',
    isReconnecting: state === 'reconnecting',
    isFailed: state === 'failed',
    reconnect,
    presence,
  };
}
