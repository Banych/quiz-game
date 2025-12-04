import { prisma } from '@infrastructure/database/prisma/client';
import { PrismaPlayerRepository } from '@infrastructure/repositories/prisma-player.repository';
import { PrismaQuizRepository } from '@infrastructure/repositories/prisma-quiz.repository';
import { AddPlayerUseCase } from '@application/use-cases/add-player.use-case';
import { FindPlayerByIdUseCase } from '@application/use-cases/find-player-by-id.use-case';
import { ListQuizPlayersUseCase } from '@application/use-cases/list-quiz-players.use-case';
import { UpdatePlayerStatusUseCase } from '@application/use-cases/update-player-status.use-case';
import { GetPlayerSessionUseCase } from '@application/use-cases/get-player-session.use-case';
import { PlayerService } from '@application/services/player-service';
import { StartQuizUseCase } from '@application/use-cases/start-quiz.use-case';
import { EndQuizUseCase } from '@application/use-cases/end-quiz.use-case';
import { FindQuizByIdUseCase } from '@application/use-cases/find-quiz-by-id.use-case';
import { GetQuizStateUseCase } from '@application/use-cases/get-quiz-state.use-case';
import { AdvanceQuestionUseCase } from '@application/use-cases/advance-question.use-case';
import { QuizService } from '@application/services/quiz-service';
import { SubmitAnswerUseCase } from '@application/use-cases/submit-answer.use-case';
import { AnswerService } from '@application/services/answer-service';
import { JoinSessionUseCase } from '@application/use-cases/join-session.use-case';
import { ResetQuizTimerUseCase } from '@application/use-cases/reset-quiz-timer.use-case';
import { SnapshotLeaderboardUseCase } from '@application/use-cases/snapshot-leaderboard.use-case';

type ServiceContainer = {
  playerService: PlayerService;
  quizService: QuizService;
  answerService: AnswerService;
  joinSessionUseCase: JoinSessionUseCase;
};

let container: ServiceContainer | null = null;

const getRepositories = () => {
  const quizRepository = new PrismaQuizRepository();
  const playerRepository = new PrismaPlayerRepository();

  return {
    quizRepository,
    playerRepository,
  } as const;
};

export const getServices = (): ServiceContainer => {
  if (container) {
    return container;
  }

  const { quizRepository, playerRepository } = getRepositories();

  const addPlayerUseCase = new AddPlayerUseCase(
    quizRepository,
    playerRepository
  );
  const listPlayersUseCase = new ListQuizPlayersUseCase(
    quizRepository,
    playerRepository
  );
  const updatePlayerStatusUseCase = new UpdatePlayerStatusUseCase(
    playerRepository
  );
  const findPlayerByIdUseCase = new FindPlayerByIdUseCase(playerRepository);
  const getPlayerSessionUseCase = new GetPlayerSessionUseCase(
    quizRepository,
    playerRepository
  );

  const playerService = new PlayerService(
    addPlayerUseCase,
    updatePlayerStatusUseCase,
    findPlayerByIdUseCase,
    listPlayersUseCase,
    getPlayerSessionUseCase
  );

  const startQuizUseCase = new StartQuizUseCase(quizRepository);
  const endQuizUseCase = new EndQuizUseCase(quizRepository);
  const findQuizUseCase = new FindQuizByIdUseCase(quizRepository);
  const getQuizStateUseCase = new GetQuizStateUseCase(
    quizRepository,
    playerRepository
  );
  const advanceQuestionUseCase = new AdvanceQuestionUseCase(quizRepository);
  const resetQuizTimerUseCase = new ResetQuizTimerUseCase(quizRepository);
  const snapshotLeaderboardUseCase = new SnapshotLeaderboardUseCase(
    quizRepository
  );

  const quizService = new QuizService(
    startQuizUseCase,
    endQuizUseCase,
    findQuizUseCase,
    getQuizStateUseCase,
    advanceQuestionUseCase,
    resetQuizTimerUseCase,
    snapshotLeaderboardUseCase
  );

  const submitAnswerUseCase = new SubmitAnswerUseCase(
    quizRepository,
    playerRepository
  );
  const answerService = new AnswerService(submitAnswerUseCase);

  const joinSessionUseCase = new JoinSessionUseCase(
    quizRepository,
    playerRepository
  );

  container = {
    playerService,
    quizService,
    answerService,
    joinSessionUseCase,
  };

  return container;
};

type ResetOptions = {
  force?: boolean;
};

export const resetServices = ({ force = false }: ResetOptions = {}) => {
  if (force) {
    container = null;
    prisma.$disconnect().catch(() => {
      // ignore disconnect errors during reset
    });
  }
};
