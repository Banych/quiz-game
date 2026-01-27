'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  IPresenceTracker,
  PresenceState,
} from '@infrastructure/realtime/presence-tracker';

// Heartbeat interval for presence updates (30 seconds)
const PRESENCE_HEARTBEAT_INTERVAL_MS = 30_000;

const PresenceTrackerContext = createContext<IPresenceTracker | null>(null);

export type PresenceTrackerProviderProps = {
  tracker: IPresenceTracker;
  children: ReactNode;
};

export const PresenceTrackerProvider = ({
  tracker,
  children,
}: PresenceTrackerProviderProps) => (
  <PresenceTrackerContext.Provider value={tracker}>
    {children}
  </PresenceTrackerContext.Provider>
);

export const usePresenceTracker = (): IPresenceTracker | null => {
  return useContext(PresenceTrackerContext);
};

export type UsePresenceOptions = {
  quizId: string;
  playerId: string;
  playerName: string;
  /** Whether to persist presence to database (calls API endpoint) */
  persistToDatabase?: boolean;
  /** Called when presence sync occurs with all connected players */
  onSync?: (presences: Record<string, PresenceState[]>) => void;
  /** Called when a player joins */
  onJoin?: (presences: PresenceState[]) => void;
  /** Called when a player leaves */
  onLeave?: (presences: PresenceState[]) => void;
};

export type UsePresenceReturn = {
  /** Whether the presence connection is active */
  isConnected: boolean;
  /** Current presence state for all players */
  presenceState: Record<string, PresenceState[]>;
  /** Manually send a presence heartbeat */
  sendHeartbeat: () => Promise<void>;
};

/**
 * Hook for tracking player presence in a quiz.
 * Joins the presence channel on mount, sends heartbeats on interval,
 * and cleans up on unmount.
 */
export const usePresence = ({
  quizId,
  playerId,
  playerName,
  persistToDatabase = false,
  onSync,
  onJoin,
  onLeave,
}: UsePresenceOptions): UsePresenceReturn => {
  const tracker = usePresenceTracker();
  const [isConnected, setIsConnected] = useState(false);
  const [presenceState, setPresenceState] = useState<
    Record<string, PresenceState[]>
  >({});
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const joinedAtRef = useRef<string>(new Date().toISOString());

  // Persist presence to database via API
  const persistPresence = useCallback(async () => {
    if (!persistToDatabase) return;

    try {
      await fetch(`/api/quiz/${quizId}/player/${playerId}/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: new Date().toISOString() }),
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[usePresence] Failed to persist presence:', error);
      }
    }
  }, [quizId, playerId, persistToDatabase]);

  // Send presence heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!tracker) return;

    const state: PresenceState = {
      playerId,
      playerName,
      joinedAt: joinedAtRef.current,
    };

    await tracker.track(quizId, state);
    await persistPresence();
  }, [tracker, quizId, playerId, playerName, persistPresence]);

  // Subscribe to presence and start heartbeat on mount
  useEffect(() => {
    if (!tracker) return;

    // Subscribe to presence events
    const unsubscribe = tracker.subscribe(quizId, playerId, {
      onSync: (state) => {
        setPresenceState(state);
        setIsConnected(true);
        onSync?.(state);
      },
      onJoin: (presences) => {
        setPresenceState(tracker.getPresenceState(quizId));
        onJoin?.(presences);
      },
      onLeave: (presences) => {
        setPresenceState(tracker.getPresenceState(quizId));
        onLeave?.(presences);
      },
    });

    // Track initial presence after subscription
    void sendHeartbeat();

    // Start heartbeat interval
    heartbeatIntervalRef.current = setInterval(() => {
      void sendHeartbeat();
    }, PRESENCE_HEARTBEAT_INTERVAL_MS);

    // Cleanup on unmount
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      void tracker.untrack(quizId);
      unsubscribe();
      setIsConnected(false);
    };
  }, [tracker, quizId, playerId, sendHeartbeat, onSync, onJoin, onLeave]);

  return {
    isConnected,
    presenceState,
    sendHeartbeat,
  };
};
