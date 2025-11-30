import type { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';
import type { Player } from '@domain/entities/player';
import type { Question } from '@domain/entities/question';
import type { Answer } from '@domain/entities/answer';
import { QuizStatus } from '@domain/entities/quiz';
import type { QuizDTO as QuizDTOType } from '@application/dtos/quiz.dto';
import type { QuestionDTO as QuestionDTOType } from '@application/dtos/question.dto';
import type { AnswerDTO as AnswerDTOType } from '@application/dtos/answer.dto';
import {
  buildLeaderboardMeta,
  mapPlayerToDTO,
} from '@application/mappers/player-mapper';

export const mapQuestionToDTO = (question: Question): QuestionDTOType => ({
  id: question.id,
  text: question.text,
  media: question.media,
  mediaType: question.mediaType,
  options: question.options,
  type: question.type,
  points: question.points,
  orderIndex: question.orderIndex,
});

export const mapAnswerToDTO = (answer: Answer): AnswerDTOType => ({
  playerId: answer.playerId,
  questionId: answer.questionId,
  value: answer.value,
  timestamp: answer.timestamp.toISOString(),
  isCorrect: answer.isCorrect,
  points: answer.points,
  timeTaken: answer.timeTaken,
});

export const mapQuizToDTO = (
  aggregate: QuizSessionAggregate,
  players: Player[]
): QuizDTOType => {
  const leaderboard = aggregate.getLeaderboard();
  const leaderboardMeta = buildLeaderboardMeta(leaderboard);

  const playerDTOs = players.map((player) =>
    mapPlayerToDTO(player, leaderboardMeta)
  );

  const answersRecord: Record<string, AnswerDTOType[]> = {};
  aggregate.answers.forEach((answers, playerId) => {
    answersRecord[playerId] = answers.map(mapAnswerToDTO);
  });

  const questions = aggregate.quizQuestions.map(mapQuestionToDTO);

  let remainingSeconds: number | null = null;
  if (aggregate.quizStatus === QuizStatus.Active) {
    try {
      remainingSeconds = aggregate.remainingTime;
    } catch {
      remainingSeconds = null;
    }
  }

  return {
    id: aggregate.quizId,
    title: aggregate.quizTitle,
    status: aggregate.quizStatus,
    currentQuestionIndex: aggregate.currentQuestionIndex,
    settings: aggregate.quizSettings,
    questions,
    players: playerDTOs,
    answers: Object.keys(answersRecord).length ? answersRecord : undefined,
    leaderboard: leaderboard.map((entry) => ({
      playerId: entry.playerId,
      score: entry.score,
    })),
    activeQuestionId: aggregate.activeQuestionId,
    startTime: aggregate.startTime?.toISOString() ?? null,
    endTime: aggregate.endTime?.toISOString() ?? null,
    joinCode: aggregate.joinCode ?? null,
    timer: {
      duration: aggregate.timerDuration,
      remainingSeconds,
      startTime: aggregate.timerStartTime?.toISOString() ?? null,
      endTime: aggregate.timerEndTime?.toISOString() ?? null,
    },
  };
};
