import { useState, useEffect } from 'react';

interface UseCountdownTimerProps {
  /**
   * Server-provided remaining seconds (can update during refetches)
   */
  remainingSeconds: number | null;
  /**
   * ISO timestamp when timer started
   */
  startTime: string | null | undefined;
  /**
   * Total duration in seconds
   */
  duration: number;
  /**
   * Whether the timer is currently active
   */
  isActive: boolean;
}

/**
 * Client-side countdown timer that smoothly counts down every second.
 * Calculates current remaining time based on startTime and elapsed time,
 * while respecting server updates for accuracy.
 */
export function useCountdownTimer({
  remainingSeconds,
  startTime,
  duration,
  isActive,
}: UseCountdownTimerProps): number {
  const [currentRemaining, setCurrentRemaining] = useState(
    remainingSeconds ?? 0
  );

  useEffect(() => {
    // When server data updates or timer becomes inactive, reset our client-side countdown
    if (!isActive || !startTime) {
      setCurrentRemaining(remainingSeconds ?? 0);
      return;
    }

    // Calculate actual remaining time based on elapsed time since startTime
    const calculateRemaining = () => {
      if (!startTime) return remainingSeconds ?? 0;

      const now = Date.now();
      const start = new Date(startTime).getTime();
      const elapsedMs = now - start;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      const calculated = duration - elapsedSec;

      // Clamp to [0, duration]
      return Math.max(0, Math.min(duration, calculated));
    };

    // Initial calculation
    setCurrentRemaining(calculateRemaining());

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setCurrentRemaining(remaining);

      // Stop counting when we reach 0
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, remainingSeconds, startTime, duration]);

  return currentRemaining;
}
