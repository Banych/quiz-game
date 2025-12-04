'use client';

import { useQuery } from '@tanstack/react-query';
import type { QuizDTO } from '@application/dtos/quiz.dto';

export const hostQuizQueryKey = (quizId: string) =>
  ['quiz', quizId, 'state'] as const;

const fetchQuizState = async (quizId: string): Promise<QuizDTO> => {
  const response = await fetch(`/api/quiz/${quizId}/state`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const { error } = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(error ?? 'Unable to load quiz state.');
  }

  return (await response.json()) as QuizDTO;
};

export type UseHostQuizStateOptions = {
  quizId: string;
  initialData: QuizDTO;
};

export const useHostQuizState = ({
  quizId,
  initialData,
}: UseHostQuizStateOptions) => {
  return useQuery({
    queryKey: hostQuizQueryKey(quizId),
    queryFn: () => fetchQuizState(quizId),
    initialData,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });
};
