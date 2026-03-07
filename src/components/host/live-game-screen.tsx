'use client';
import { useEffect } from 'react';
import { useHostQuizState } from '@hooks/use-host-quiz-state';
import type { QuizDTO } from '@application/dtos/quiz.dto';
import { LobbyView } from './live/lobby-view';
import { QuestionView } from './live/question-view';
import { RoundResultsView } from './live/round-results-view';
import { FinalResultsView } from './live/final-results-view';

type Props = { quizId: string; initialData: QuizDTO };

export function LiveGameScreen({ quizId, initialData }: Props) {
  const {
    data: quiz,
    roundSummary,
    clearRoundSummary,
  } = useHostQuizState({ quizId, initialData });

  useEffect(() => {
    clearRoundSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.activeQuestionId]);

  if (quiz.status === 'Completed') return <FinalResultsView quiz={quiz} />;
  if (quiz.status === 'Active' && roundSummary)
    return <RoundResultsView summary={roundSummary} />;
  if (quiz.status === 'Active' && quiz.activeQuestionId)
    return <QuestionView quiz={quiz} />;
  if (quiz.status === 'Active') return <LobbyView quiz={quiz} startingSoon />;
  return <LobbyView quiz={quiz} />;
}
