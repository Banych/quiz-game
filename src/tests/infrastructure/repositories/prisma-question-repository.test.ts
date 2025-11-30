import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaQuestionRepository } from '@infrastructure/repositories/prisma-question.repository';
import { Question } from '@domain/entities/question';
import { prisma } from '@infrastructure/database/prisma/client';

const questionMocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findMany: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

const transactionMock = vi.hoisted(() =>
  vi.fn(async (operations: Promise<unknown>[]) => {
    await Promise.all(operations);
  })
);

vi.mock('@infrastructure/database/prisma/client', () => ({
  prisma: {
    question: questionMocks,
    $transaction: transactionMock,
  },
}));

const repository = new PrismaQuestionRepository();

describe('PrismaQuestionRepository', () => {
  beforeEach(() => {
    Object.values(questionMocks).forEach((mockFn) => mockFn.mockReset());
    transactionMock.mockClear();
  });

  it('finds a question by id', async () => {
    questionMocks.findUnique.mockResolvedValue({
      id: 'q1',
      quizId: 'quiz-1',
      text: 'Capital of France?',
      mediaUrl: null,
      mediaType: null,
      options: [],
      correctAnswers: ['Paris'],
      type: 'text',
      points: 10,
      orderIndex: 1,
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const question = await repository.findById('q1');

    expect(question).toBeInstanceOf(Question);
    expect(question?.quizId).toBe('quiz-1');
    expect(prisma.question.findUnique).toHaveBeenCalledWith({
      where: { id: 'q1' },
    });
  });

  it('lists questions for a quiz', async () => {
    questionMocks.findMany.mockResolvedValue([
      {
        id: 'q2',
        quizId: 'quiz-1',
        text: 'Second?',
        mediaUrl: null,
        mediaType: null,
        options: [],
        correctAnswers: ['A'],
        type: 'multiple_choice',
        points: 5,
        orderIndex: 2,
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'q1',
        quizId: 'quiz-1',
        text: 'First?',
        mediaUrl: null,
        mediaType: null,
        options: [],
        correctAnswers: ['B'],
        type: 'text',
        points: 10,
        orderIndex: 1,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const questions = await repository.listByQuizId('quiz-1');

    expect(questions).toHaveLength(2);
    expect(questions[0]).toBeInstanceOf(Question);
    expect(prisma.question.findMany).toHaveBeenCalledWith({
      where: { quizId: 'quiz-1' },
      orderBy: { orderIndex: 'asc' },
    });
  });

  it('lists published questions for a quiz', async () => {
    questionMocks.findMany.mockResolvedValue([]);

    await repository.listPublishedByQuizId('quiz-1');

    expect(prisma.question.findMany).toHaveBeenCalledWith({
      where: { quizId: 'quiz-1', isPublished: true },
      orderBy: { orderIndex: 'asc' },
    });
  });

  it('saves a question via upsert', async () => {
    const question = new Question(
      'q1',
      'What is 2 + 2?',
      ['4'],
      'text',
      10,
      undefined,
      undefined,
      ['3', '4']
    );
    question.quizId = 'quiz-1';
    question.orderIndex = 3;
    question.isPublished = true;

    await repository.save(question);

    expect(prisma.question.upsert).toHaveBeenCalledWith({
      where: { id: 'q1' },
      create: expect.objectContaining({ quizId: 'quiz-1', orderIndex: 3 }),
      update: expect.objectContaining({ text: 'What is 2 + 2?' }),
    });
  });

  it('refuses to save a question without quizId', async () => {
    const question = new Question('q1', 'Q', ['A'], 'text', 5);

    await expect(repository.save(question)).rejects.toThrow(
      'Question quizId is required to save the record.'
    );
  });

  it('updates publish state', async () => {
    questionMocks.update.mockResolvedValue({ id: 'q1' });

    await repository.updatePublishState('q1', true);

    expect(prisma.question.update).toHaveBeenCalledWith({
      where: { id: 'q1' },
      data: { isPublished: true },
    });
  });

  it('updates ordering via transaction', async () => {
    await repository.updateOrder([
      { questionId: 'q1', orderIndex: 1 },
      { questionId: 'q2', orderIndex: 2 },
    ]);

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(prisma.question.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'q1' },
      data: { orderIndex: 1 },
    });
    expect(prisma.question.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'q2' },
      data: { orderIndex: 2 },
    });
  });

  it('deletes a question', async () => {
    questionMocks.delete.mockResolvedValue({ id: 'q1' });

    await repository.delete('q1');

    expect(prisma.question.delete).toHaveBeenCalledWith({
      where: { id: 'q1' },
    });
  });
});
