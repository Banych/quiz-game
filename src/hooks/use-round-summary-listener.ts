'use client';

import type { RoundSummaryDTO } from '@application/dtos/round-summary.dto';
import { useRealtimeClient } from '@hooks/use-realtime-client';
import { useEffect, useState } from 'react';

export const useRoundSummaryListener = (quizId: string) => {
  const realtimeClient = useRealtimeClient();
  const [roundSummary, setRoundSummary] = useState<RoundSummaryDTO | null>(
    null
  );

  useEffect(() => {
    const unsubscribe = realtimeClient.subscribe<RoundSummaryDTO>(
      `quiz:${quizId}`,
      'question:locked',
      (summary) => {
        setRoundSummary(summary);
        // Auto-clear after 10 seconds
        setTimeout(() => setRoundSummary(null), 10000);
      }
    );

    return unsubscribe;
  }, [quizId, realtimeClient]);

  return roundSummary;
};
