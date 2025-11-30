import { randomUUID } from 'node:crypto';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { AddPlayerUseCase } from '@application/use-cases/add-player.use-case';

const integrationDatabaseUrl =
  process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? null;
const integrationFlag = process.env.ENABLE_PRISMA_INTEGRATION_TESTS === 'true';
const shouldRunIntegration = Boolean(integrationDatabaseUrl) && integrationFlag;
const describeIntegration = shouldRunIntegration ? describe : describe.skip;
const originalDatabaseUrl = process.env.DATABASE_URL;

type PrismaQuizRepositoryCtor =
  typeof import('@infrastructure/repositories/prisma-quiz.repository').PrismaQuizRepository;
type PrismaPlayerRepositoryCtor =
  typeof import('@infrastructure/repositories/prisma-player.repository').PrismaPlayerRepository;
type ResetDatabaseFn =
  typeof import('@infrastructure/database/prisma/seed-helpers').resetDatabase;
type SeedSampleQuizFn =
  typeof import('@infrastructure/database/prisma/seed-helpers').seedSampleQuiz;
type PrismaClientInstance =
  typeof import('@infrastructure/database/prisma/client').prisma;

describeIntegration('AddPlayerUseCase integration', () => {
  let quizId: string;
  let addPlayerUseCase!: AddPlayerUseCase;
  let quizRepository!: InstanceType<PrismaQuizRepositoryCtor>;
  let playerRepository!: InstanceType<PrismaPlayerRepositoryCtor>;
  let prismaClient!: PrismaClientInstance;
  let resetDb!: ResetDatabaseFn;
  let seedQuiz!: SeedSampleQuizFn;
  let initialized = false;

  beforeAll(async () => {
    if (!shouldRunIntegration || !integrationDatabaseUrl) {
      console.warn(
        'Skipping Prisma-backed integration tests. Set DATABASE_URL_TEST (or DATABASE_URL) plus ENABLE_PRISMA_INTEGRATION_TESTS=true to opt in.'
      );
      return;
    }

    process.env.DATABASE_URL = integrationDatabaseUrl;

    const [
      { PrismaQuizRepository },
      { PrismaPlayerRepository },
      { prisma },
      seedHelpers,
    ] = await Promise.all([
      import('@infrastructure/repositories/prisma-quiz.repository'),
      import('@infrastructure/repositories/prisma-player.repository'),
      import('@infrastructure/database/prisma/client'),
      import('@infrastructure/database/prisma/seed-helpers'),
    ]);

    quizRepository = new PrismaQuizRepository();
    playerRepository = new PrismaPlayerRepository();
    addPlayerUseCase = new AddPlayerUseCase(quizRepository, playerRepository);
    prismaClient = prisma;
    resetDb = seedHelpers.resetDatabase;
    seedQuiz = seedHelpers.seedSampleQuiz;
    initialized = true;
  });

  beforeEach(async () => {
    if (!initialized) {
      return;
    }
    await resetDb();
    const { quiz } = await seedQuiz({ playerNames: [] });
    quizId = quiz.id;
  });

  afterAll(async () => {
    if (!initialized) {
      process.env.DATABASE_URL = originalDatabaseUrl;
      return;
    }
    await resetDb();
    await prismaClient.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('persists a new player and updates quiz roster via Prisma repositories', async () => {
    if (!initialized) {
      throw new Error(
        'Integration harness failed to initialize; verify ENABLE_PRISMA_INTEGRATION_TESTS and database URLs.'
      );
    }
    const playerId = randomUUID();

    await addPlayerUseCase.execute(quizId, playerId, 'Integration Player');

    const persistedPlayer = await prismaClient.player.findUnique({
      where: { id: playerId },
    });

    expect(persistedPlayer).toMatchObject({
      id: playerId,
      quizId,
      name: 'Integration Player',
      status: 'Active',
    });

    const refreshedQuiz = await quizRepository.findById(quizId);
    expect(refreshedQuiz).not.toBeNull();
    expect(refreshedQuiz?.hasPlayer(playerId)).toBe(true);
  });
});
