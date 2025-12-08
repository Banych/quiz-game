'use client';

import { useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PlayerSessionDTO } from '@application/dtos/player-session.dto';
import type { QuizDTO } from '@application/dtos/quiz.dto';
import { useRealtimeClient } from '@hooks/use-realtime-client';

export const playerSessionQueryKey = (quizId: string, playerId: string) =>
  ['player-session', quizId, playerId] as const;

const fetchPlayerSession = async (
  quizId: string,
  playerId: string
): Promise<PlayerSessionDTO> => {
  const response = await fetch(`/api/quiz/${quizId}/player/${playerId}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const { error } = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(error ?? 'Unable to load player session.');
  }

  return (await response.json()) as PlayerSessionDTO;
};

const submitPlayerAnswer = async (input: {
  quizId: string;
  playerId: string;
  questionId: string;
  answer: string;
}) => {
  const response = await fetch('/api/player/answer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const { error } = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(error ?? 'Failed to submit answer.');
  }

  return (await response.json()) as { status: string };
};

export type UsePlayerSessionOptions = {
  quizId: string;
  playerId: string;
  initialData: PlayerSessionDTO;
};

export const usePlayerSession = ({
  quizId,
  playerId,
  initialData,
}: UsePlayerSessionOptions) => {
  const realtimeClient = useRealtimeClient();
  const queryClient = useQueryClient();
  const queryKey = playerSessionQueryKey(quizId, playerId);
  const channelName = `quiz:${quizId}`;

  const applyQuizState = useCallback(
    (nextQuizState: QuizDTO) => {
      queryClient.setQueryData<PlayerSessionDTO | undefined>(
        queryKey,
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            quiz: nextQuizState,
          };
        }
      );
    },
    [queryClient, queryKey]
  );

  useEffect(() => {
    const unsubscribe = realtimeClient.subscribe<QuizDTO>(
      channelName,
      'state:update',
      (updatedState) => {
        applyQuizState(updatedState);
      }
    );

    return unsubscribe;
  }, [applyQuizState, channelName, realtimeClient]);

  const submitAnswerMutation = useMutation({
    mutationFn: ({
      questionId,
      answer,
    }: {
      questionId: string;
      answer: string;
    }) => submitPlayerAnswer({ quizId, playerId, questionId, answer }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const queryResult = useQuery({
    queryKey,
    queryFn: () => fetchPlayerSession(quizId, playerId),
    initialData,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });

  return {
    ...queryResult,
    submitAnswer: submitAnswerMutation.mutateAsync,
    isSubmittingAnswer: submitAnswerMutation.isPending,
  } as const;
};
