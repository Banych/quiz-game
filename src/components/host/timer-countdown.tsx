'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useCountdownTimer } from '@/hooks/use-countdown-timer';

interface TimerCountdownProps {
  /**
   * Total duration in seconds
   */
  duration: number;
  /**
   * Remaining seconds (null means timer not active)
   */
  remainingSeconds: number | null;
  /**
   * Optional start time for display
   */
  startTime?: string | null;
  /**
   * Size of the timer component
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Show elapsed time instead of remaining
   */
  showElapsed?: boolean;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function TimerCountdown({
  duration,
  remainingSeconds,
  startTime,
  size = 'medium',
  showElapsed = false,
}: TimerCountdownProps) {
  const isActive = typeof remainingSeconds === 'number' && !!startTime;

  // Use client-side countdown hook for smooth ticking
  const currentRemaining = useCountdownTimer({
    remainingSeconds,
    startTime,
    duration,
    isActive,
  });

  const elapsed = isActive ? duration - currentRemaining : 0;
  const displayTime = showElapsed ? elapsed : currentRemaining;

  // Calculate progress percentage (0-100)
  const progress = useMemo(() => {
    if (!isActive || duration === 0) return 0;
    return ((duration - currentRemaining) / duration) * 100;
  }, [isActive, duration, currentRemaining]);

  // Determine warning state based on remaining time
  const warningState = useMemo(() => {
    if (!isActive) return 'inactive';
    const percentRemaining = (currentRemaining / duration) * 100;
    if (percentRemaining <= 10) return 'critical'; // Red when ≤10% left
    if (percentRemaining <= 30) return 'warning'; // Yellow when ≤30% left
    return 'normal';
  }, [isActive, duration, currentRemaining]);

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-24 h-24',
      circle: { radius: 40, strokeWidth: 6 },
      text: 'text-xl',
      label: 'text-xs',
    },
    medium: {
      container: 'w-32 h-32',
      circle: { radius: 54, strokeWidth: 8 },
      text: 'text-3xl',
      label: 'text-sm',
    },
    large: {
      container: 'w-40 h-40',
      circle: { radius: 68, strokeWidth: 10 },
      text: 'text-4xl',
      label: 'text-base',
    },
  };

  const config = sizeConfig[size];
  const { radius, strokeWidth } = config.circle;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const center = radius + strokeWidth;
  const viewBoxSize = (radius + strokeWidth) * 2;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={cn('relative', config.container)}>
        {/* SVG Progress Circle */}
        <svg
          className="absolute inset-0 -rotate-90 transform"
          width="100%"
          height="100%"
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              'transition-all duration-300',
              warningState === 'critical' && 'text-red-500',
              warningState === 'warning' && 'text-amber-500',
              warningState === 'normal' && 'text-green-500',
              warningState === 'inactive' && 'text-muted'
            )}
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              'font-mono font-semibold tabular-nums',
              config.text,
              warningState === 'critical' && 'text-red-500',
              warningState === 'warning' && 'text-amber-500',
              warningState === 'normal' && 'text-foreground',
              warningState === 'inactive' && 'text-muted-foreground'
            )}
          >
            {formatTime(displayTime)}
          </span>
        </div>
      </div>

      {/* Timer info */}
      <div className="flex flex-col items-center gap-1 text-center">
        <span className={cn('font-medium uppercase tracking-wide', config.label)}>
          {isActive ? (showElapsed ? 'Elapsed' : 'Remaining') : 'Timer Paused'}
        </span>
        {startTime && (
          <span className={cn('text-muted-foreground', config.label)}>
            Started: {new Date(startTime).toLocaleTimeString()}
          </span>
        )}
        {isActive && (
          <span className={cn('text-muted-foreground', config.label)}>
            {Math.round(progress)}% complete
          </span>
        )}
      </div>
    </div>
  );
}
