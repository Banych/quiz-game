/**
 * Debounced leaderboard broadcast utility for batching score updates.
 * Prevents excessive real-time broadcasts during rapid answer submissions.
 */

type BroadcastFunction = (quizId: string) => Promise<void>;

interface DebouncedBroadcaster {
  /**
   * Schedule a leaderboard broadcast with 500ms debounce.
   * Multiple calls within the debounce window will be batched into one broadcast.
   */
  schedule: (quizId: string) => void;

  /**
   * Immediately flush any pending broadcasts.
   * Used when advancing questions to ensure leaderboard is up-to-date.
   */
  flush: () => Promise<void>;
}

/**
 * Create a debounced leaderboard broadcaster.
 * Batches multiple score updates within 500ms into a single broadcast.
 *
 * @param broadcastFn - The function to call for broadcasting leaderboard updates
 * @param debounceMs - Debounce delay in milliseconds (default: 500ms)
 * @returns DebouncedBroadcaster with schedule() and flush() methods
 *
 * @example
 * ```typescript
 * const broadcaster = createDebouncedBroadcaster(
 *   async (quizId) => {
 *     const quiz = await quizRepository.findById(quizId);
 *     await realtimeClient.broadcastLeaderboard(quizId, quiz.getLeaderboard());
 *   }
 * );
 *
 * // Multiple rapid calls are batched
 * broadcaster.schedule('quiz-123'); // Broadcast scheduled
 * broadcaster.schedule('quiz-123'); // No-op, already scheduled
 * broadcaster.schedule('quiz-123'); // No-op, already scheduled
 * // ... 500ms later, single broadcast occurs
 *
 * // Flush immediately when advancing question
 * await broadcaster.flush(); // Broadcasts immediately
 * ```
 */
export function createDebouncedBroadcaster(
  broadcastFn: BroadcastFunction,
  debounceMs: number = 500
): DebouncedBroadcaster {
  const pendingQuizzes = new Map<string, NodeJS.Timeout>();

  const schedule = (quizId: string): void => {
    // Clear existing timer if any
    const existingTimer = pendingQuizzes.get(quizId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule new broadcast
    const timer = setTimeout(async () => {
      pendingQuizzes.delete(quizId);
      try {
        await broadcastFn(quizId);
      } catch (error) {
        console.error(
          `[DebouncedBroadcaster] Failed to broadcast leaderboard for quiz ${quizId}:`,
          error
        );
      }
    }, debounceMs);

    pendingQuizzes.set(quizId, timer);
  };

  const flush = async (): Promise<void> => {
    const flushPromises: Promise<void>[] = [];

    // Clear all timers and execute broadcasts immediately
    for (const [quizId, timer] of pendingQuizzes.entries()) {
      clearTimeout(timer);
      flushPromises.push(
        broadcastFn(quizId).catch((error) => {
          console.error(
            `[DebouncedBroadcaster] Failed to flush broadcast for quiz ${quizId}:`,
            error
          );
        })
      );
    }

    pendingQuizzes.clear();
    await Promise.all(flushPromises);
  };

  return { schedule, flush };
}

/**
 * Singleton instance for global leaderboard broadcasting.
 * Initialized lazily on first use.
 */
let globalBroadcaster: DebouncedBroadcaster | null = null;

/**
 * Get or create the global debounced broadcaster.
 * Uses the provided broadcast function on first initialization.
 *
 * @param broadcastFn - Function to broadcast leaderboard updates
 * @returns The global DebouncedBroadcaster instance
 */
export function getGlobalBroadcaster(
  broadcastFn: BroadcastFunction
): DebouncedBroadcaster {
  if (!globalBroadcaster) {
    globalBroadcaster = createDebouncedBroadcaster(broadcastFn);
  }
  return globalBroadcaster;
}

/**
 * Reset the global broadcaster instance.
 * Useful for testing or when changing broadcast implementations.
 */
export function resetGlobalBroadcaster(): void {
  if (globalBroadcaster) {
    // Flush any pending broadcasts before resetting
    globalBroadcaster.flush().catch((error) => {
      console.error('[DebouncedBroadcaster] Error during reset flush:', error);
    });
    globalBroadcaster = null;
  }
}
