import { randomUUID } from 'node:crypto';
import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';
import { Quiz, QuizStatus } from '@domain/entities/quiz';
import { Answer } from '@domain/entities/answer';
import type {
  IQuizRepository,
  QuizProgressUpdate,
} from '@domain/repositories/quiz-repository';
import type { LeaderboardScore } from '@domain/types/leaderboard-score';
import { prisma } from '@infrastructure/database/prisma/client';
import type { Prisma } from '@prisma/client';
import { mapPrismaQuestionToDomain } from '@infrastructure/repositories/mappers/prisma-question-mapper';

const quizInclude = {
  questions: true,
  players: { select: { id: true } },
  answers: true,
} as const;

type QuizWithRelations = Prisma.QuizGetPayload<{ include: typeof quizInclude }>;

const toSeconds = (value?: number | null) =>
  typeof value === 'number' ? value / 1000 : undefined;

const toMilliseconds = (value?: number) =>
  typeof value === 'number' ? Math.round(value * 1000) : null;

const mapQuizRecordToAggregate = (
  record: QuizWithRelations
): QuizSessionAggregate => {
  const questions = [...record.questions]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((question) => mapPrismaQuestionToDomain(question));

  const quiz = new Quiz(record.id, record.title, questions, {
    timePerQuestion: record.timePerQuestion,
    allowSkipping: record.allowSkipping,
  });
  quiz.joinCode = record.joinCode ?? undefined;

  quiz.status = record.status as QuizStatus;
  quiz.currentQuestionIndex = record.currentQuestionIndex;
  quiz.startTime = record.startTime ?? undefined;
  quiz.endTime = record.endTime ?? undefined;

  record.players.forEach(({ id }) => quiz.addPlayer(id));

  const sortedAnswers = [...record.answers].sort(
    (a, b) => a.submittedAt.getTime() - b.submittedAt.getTime()
  );

  sortedAnswers.forEach((answerRecord) => {
    if (!quiz.players.has(answerRecord.playerId)) {
      quiz.addPlayer(answerRecord.playerId);
    }

    const answer = new Answer(
      answerRecord.playerId,
      answerRecord.questionId,
      answerRecord.value,
      answerRecord.submittedAt,
      toSeconds(answerRecord.timeTakenMs)
    );

    if (answerRecord.isCorrect === true) {
      answer.markCorrect(answerRecord.points ?? 0);
    } else if (answerRecord.isCorrect === false) {
      answer.markIncorrect();
      if (typeof answerRecord.points === 'number') {
        answer.points = answerRecord.points;
      }
    } else if (typeof answerRecord.points === 'number') {
      answer.points = answerRecord.points;
    }

    quiz.submitAnswer(answerRecord.playerId, answer);
  });

  return new QuizSessionAggregate(quiz, record.timePerQuestion, {
    timerStartTime: record.timerStartedAt ?? undefined,
    timerEndTime: record.timerExpiresAt ?? undefined,
  });
};

const buildAnswerWrites = (aggregate: QuizSessionAggregate) => {
  const data = [] as Prisma.AnswerCreateManyInput[];

  aggregate.answers.forEach((answers, playerId) => {
    answers.forEach((answer) => {
      data.push({
        id: randomUUID(),
        quizId: aggregate.quizId,
        playerId,
        questionId: answer.questionId,
        value: answer.value,
        submittedAt: answer.timestamp,
        isCorrect:
          typeof answer.isCorrect === 'boolean' ? answer.isCorrect : null,
        points: typeof answer.points === 'number' ? answer.points : null,
        timeTakenMs: toMilliseconds(answer.timeTaken),
      });
    });
  });

  return data;
};

export class PrismaQuizRepository implements IQuizRepository {
  async findById(id: string): Promise<QuizSessionAggregate | null> {
    const record = await prisma.quiz.findUnique({
      where: { id },
      include: quizInclude,
    });

    return record ? mapQuizRecordToAggregate(record) : null;
  }

  async findByJoinCode(joinCode: string): Promise<QuizSessionAggregate | null> {
    const record = await prisma.quiz.findUnique({
      where: { joinCode },
      include: quizInclude,
    });

    return record ? mapQuizRecordToAggregate(record) : null;
  }

  async listByStatus(status: QuizStatus): Promise<QuizSessionAggregate[]> {
    const records = await prisma.quiz.findMany({
      where: { status },
      include: quizInclude,
      orderBy: { createdAt: 'desc' },
    });

    return records.map(mapQuizRecordToAggregate);
  }

  async save(quizAggregate: QuizSessionAggregate): Promise<void> {
    await prisma.quiz.update({
      where: { id: quizAggregate.quizId },
      data: {
        title: quizAggregate.quizTitle,
        status: quizAggregate.quizStatus,
        currentQuestionIndex: quizAggregate.currentQuestionIndex,
        activeQuestionId: quizAggregate.activeQuestionId,
        startTime: quizAggregate.startTime ?? null,
        endTime: quizAggregate.endTime ?? null,
        timerStartedAt: quizAggregate.timerStartTime ?? null,
        timerExpiresAt: quizAggregate.timerEndTime ?? null,
        timePerQuestion: quizAggregate.quizSettings.timePerQuestion,
        allowSkipping: quizAggregate.quizSettings.allowSkipping,
        joinCode: quizAggregate.joinCode ?? null,
      },
    });

    await prisma.answer.deleteMany({ where: { quizId: quizAggregate.quizId } });

    const answers = buildAnswerWrites(quizAggregate);
    if (answers.length > 0) {
      await prisma.answer.createMany({ data: answers });
    }
  }

  async updateCurrentQuestion(
    quizId: string,
    progress: QuizProgressUpdate
  ): Promise<void> {
    await prisma.quiz.update({
      where: { id: quizId },
      data: {
        currentQuestionIndex: progress.currentQuestionIndex,
        activeQuestionId: progress.activeQuestionId,
      },
    });
  }

  async updateLeaderboard(
    quizId: string,
    leaderboard: LeaderboardScore[]
  ): Promise<void> {
    if (leaderboard.length === 0) {
      await prisma.player.updateMany({
        where: { quizId },
        data: { rank: null },
      });
      return;
    }

    await prisma.$transaction(
      leaderboard.map((entry, index) =>
        prisma.player.update({
          where: { id: entry.playerId },
          data: { score: entry.score, rank: index + 1 },
        })
      )
    );

    await prisma.player.updateMany({
      where: {
        quizId,
        id: { notIn: leaderboard.map((entry) => entry.playerId) },
      },
      data: { rank: null },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.quiz.delete({ where: { id } });
  }
}
