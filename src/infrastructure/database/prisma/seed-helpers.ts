import { randomUUID } from 'node:crypto';
import { prisma } from '@infrastructure/database/prisma/client';
import type {
  Player,
  Prisma,
  Question,
  Quiz,
  QuestionType,
} from '@infrastructure/database/prisma/generated-client';

export type SeedQuizOptions = {
  title?: string;
  questionCount?: number;
  playerNames?: string[];
  publishQuestions?: boolean;
};

export type SeedQuizResult = {
  quiz: Quiz;
  questions: Question[];
  players: Player[];
};

type SeedQuestionInput = Prisma.QuestionCreateManyInput & {
  id: string;
  correctAnswers: string[];
};

type SeedPlayerInput = Prisma.PlayerCreateManyInput & {
  id: string;
};

const QUESTION_TEMPLATES: Array<{
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswers: string[];
  points?: number;
}> = [
  {
    text: 'What is the capital of France?',
    type: 'multiple_choice',
    options: ['Paris', 'London', 'Berlin', 'Rome'],
    correctAnswers: ['Paris'],
    points: 100,
  },
  {
    text: 'React hooks were introduced in which version?',
    type: 'multiple_choice',
    options: ['15.0', '16.8', '17.0', '18.0'],
    correctAnswers: ['16.8'],
    points: 150,
  },
  {
    text: 'True or false: Prisma supports PostgreSQL.',
    type: 'true_false',
    options: ['true', 'false'],
    correctAnswers: ['true'],
    points: 75,
  },
  {
    text: 'Briefly describe what DTO stands for.',
    type: 'text',
    correctAnswers: ['Data Transfer Object'],
    points: 50,
  },
];

export const resetDatabase = async () => {
  await prisma.$transaction([
    prisma.answer.deleteMany(),
    prisma.player.deleteMany(),
    prisma.question.deleteMany(),
    prisma.quiz.deleteMany(),
  ]);
};

export const seedSampleQuiz = async (
  options: SeedQuizOptions = {}
): Promise<SeedQuizResult> => {
  const quiz = await prisma.quiz.create({
    data: {
      title: options.title ?? 'Trivia Night Demo',
      status: 'Pending',
      timePerQuestion: 30,
      allowSkipping: true,
      joinCode: `JOIN-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    },
  });

  const questionCount = options.questionCount ?? QUESTION_TEMPLATES.length;
  const publishQuestions = options.publishQuestions ?? true;

  const questionInputs: SeedQuestionInput[] = Array.from({
    length: questionCount,
  }).map((_, index) => {
    const template = QUESTION_TEMPLATES[index % QUESTION_TEMPLATES.length];

    return {
      id: randomUUID(),
      quizId: quiz.id,
      text: template.text,
      options: template.options ?? [],
      correctAnswers: template.correctAnswers,
      type: template.type,
      points: template.points ?? 100,
      orderIndex: index,
      isPublished: publishQuestions,
    } satisfies SeedQuestionInput;
  });

  if (questionInputs.length) {
    await prisma.question.createMany({ data: questionInputs });
  }

  const playerNames = options.playerNames ?? ['Alex', 'Jamie'];
  const playerInputs: SeedPlayerInput[] = playerNames.map((name, index) => ({
    id: randomUUID(),
    quizId: quiz.id,
    name,
    status: 'Active',
    score: 100 * (playerNames.length - index),
    rank: index + 1,
  }));

  if (playerInputs.length) {
    await prisma.player.createMany({ data: playerInputs });
  }

  const now = new Date();
  const firstQuestion = questionInputs[0];
  const firstAnswerValue = firstQuestion?.correctAnswers?.[0] ?? 'N/A';
  const answerInputs: Prisma.AnswerCreateManyInput[] = playerInputs.flatMap(
    (player) => {
      if (!firstQuestion) {
        return [];
      }

      return [
        {
          id: randomUUID(),
          quizId: quiz.id,
          playerId: player.id,
          questionId: firstQuestion.id,
          value: firstAnswerValue,
          submittedAt: now,
          isCorrect: true,
          points: firstQuestion.points,
          timeTakenMs: 2500,
        },
      ];
    }
  );

  if (answerInputs.length) {
    await prisma.answer.createMany({ data: answerInputs });
  }

  const [questions, players] = await Promise.all([
    prisma.question.findMany({
      where: { quizId: quiz.id },
      orderBy: { orderIndex: 'asc' },
    }),
    prisma.player.findMany({
      where: { quizId: quiz.id },
      orderBy: { connectedAt: 'asc' },
    }),
  ]);

  return { quiz, questions, players };
};

export const seedDemoQuiz = async () => seedSampleQuiz();
