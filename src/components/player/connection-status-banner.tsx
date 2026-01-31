'use client';

import { cn } from '@/lib/utils';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReconnectionState } from '@hooks/use-reconnection';

export interface ConnectionStatusBannerProps {
  /** Current reconnection state */
  state: ReconnectionState;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Banner that displays connection status to players.
 *
 * Shows different states:
 * - **disconnected:** Red banner with "Connection lost" message
 * - **reconnecting:** Yellow banner with spinner and "Reconnecting..." message
 * - **failed:** Red banner with "Reconnection failed" message and Retry button
 * - **connected:** Hidden (auto-hide)
 *
 * @example
 * const { state, reconnect } = useReconnection({ ... });
 * <ConnectionStatusBanner state={state} onRetry={reconnect} />
 */
export function ConnectionStatusBanner({
  state,
  onRetry,
  className,
}: ConnectionStatusBannerProps) {
  // Hide banner when connected
  if (state === 'connected') {
    return null;
  }

  const bannerConfig = {
    disconnected: {
      icon: WifiOff,
      iconClassName: 'size-5',
      message: 'Connection lost',
      description: 'Trying to reconnect...',
      bgColor: 'bg-destructive',
      textColor: 'text-destructive-foreground',
      showRetry: false,
    },
    reconnecting: {
      icon: RefreshCw,
      iconClassName: 'size-5 animate-spin',
      message: 'Reconnecting...',
      description: 'Please wait while we restore your session',
      bgColor: 'bg-yellow-500 dark:bg-yellow-600',
      textColor: 'text-yellow-950 dark:text-yellow-50',
      showRetry: false,
    },
    failed: {
      icon: AlertCircle,
      iconClassName: 'size-5',
      message: 'Reconnection failed',
      description: 'Unable to restore your session',
      bgColor: 'bg-destructive',
      textColor: 'text-destructive-foreground',
      showRetry: true,
    },
  }[state];

  const Icon = bannerConfig.icon;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-3 shadow-md',
        bannerConfig.bgColor,
        bannerConfig.textColor,
        className
      )}
    >
      <div className="mx-auto max-w-4xl flex items-center gap-3">
        {/* Icon */}
        <Icon className={cn('shrink-0', bannerConfig.iconClassName)} />

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm sm:text-base">
            {bannerConfig.message}
          </p>
          <p className="text-xs sm:text-sm opacity-90 hidden sm:block">
            {bannerConfig.description}
          </p>
        </div>

        {/* Retry Button (only for 'failed' state) */}
        {bannerConfig.showRetry && onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className={cn(
              'shrink-0',
              'bg-transparent border-current hover:bg-black/10 dark:hover:bg-white/10'
            )}
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
