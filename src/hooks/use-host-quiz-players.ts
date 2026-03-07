'use client';

import { useQuery } from '@tanstack/react-query';
import type { PlayerConnectionStatusDTO } from '@application/dtos/player-connection-status.dto.ts';

/**
 * Query key for player connection status
 */
export const playerConnectionStatusQueryKey = (quizId: string) =>
  ['quiz', quizId, 'players', 'status'] as const;

/**
 * Fetch player connection status from the API
 */
const fetchPlayerConnectionStatus = async (
  quizId: string
): Promise<PlayerConnectionStatusDTO[]> => {
  const response = await fetch(`/api/quiz/${quizId}/players/status`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const { error } = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(error ?? 'Unable to load player connection status.');
  }

  return (await response.json()) as PlayerConnectionStatusDTO[];
};

/**
 * Hook for hosts to fetch and poll player connection status
 *
 * Features:
 * - Polls every 5 seconds (configurable staleTime)
 * - Automatic refetching when tab regains focus
 * - Error handling with human-readable messages
 * - Type-safe DTO responses
 *
 * @param quizId - The quiz ID to fetch player status for
 * @param enabled - Whether the query should run (default: true)
 * @param refetchInterval - How often to refetch in milliseconds (default: 5000)
 * @returns TanStack Query result with player status data
 *
 * @example
 * ```tsx
 * const { data: players, isLoading, error } = useHostQuizPlayers(quizId);
 * return (
 *   <div>
 *     {players?.map(p => (
 *       <PlayerStatusRow key={p.playerId} player={p} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useHostQuizPlayers(
  quizId: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  const { enabled = true, refetchInterval = 5000 } = options ?? {};

  return useQuery({
    queryKey: playerConnectionStatusQueryKey(quizId),
    queryFn: () => fetchPlayerConnectionStatus(quizId),
    enabled: enabled && !!quizId,
    staleTime: 5000, // Data is fresh for 5 seconds
    refetchInterval, // Refetch every 5 seconds (or custom interval)
    refetchOnWindowFocus: true, // Refetch when tab regains focus
    retry: 2, // Retry twice on network failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}
