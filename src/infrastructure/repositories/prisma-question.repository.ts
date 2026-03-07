import { Question } from '@domain/entities/question';
import type {
  IQuestionRepository,
  QuestionOrderUpdate,
} from '@domain/repositories/question-repository';
import { prisma } from '@infrastructure/database/prisma/client';
import {
  mapPrismaQuestionToDomain,
  mapQuestionToPrismaCreateInput,
  mapQuestionToPrismaUpdateInput,
} from '@infrastructure/repositories/mappers/prisma-question-mapper';

export class PrismaQuestionRepository implements IQuestionRepository {
  async findById(id: string): Promise<Question | null> {
    const record = await prisma.question.findUnique({ where: { id } });
    return record ? mapPrismaQuestionToDomain(record) : null;
  }

  async listByQuizId(quizId: string): Promise<Question[]> {
    const records = await prisma.question.findMany({
      where: { quizId },
      orderBy: { orderIndex: 'asc' },
    });

    return records.map(mapPrismaQuestionToDomain);
  }

  async listPublishedByQuizId(quizId: string): Promise<Question[]> {
    const records = await prisma.question.findMany({
      where: { quizId, isPublished: true },
      orderBy: { orderIndex: 'asc' },
    });

    return records.map(mapPrismaQuestionToDomain);
  }

  async updatePublishState(
    questionId: string,
    isPublished: boolean
  ): Promise<void> {
    await prisma.question.update({
      where: { id: questionId },
      data: { isPublished },
    });
  }

  async updateOrder(order: QuestionOrderUpdate[]): Promise<void> {
    if (!order.length) {
      return;
    }

    await prisma.$transaction(
      order.map(({ questionId, orderIndex }) =>
        prisma.question.update({
          where: { id: questionId },
          data: { orderIndex },
        })
      )
    );
  }

  async save(question: Question): Promise<void> {
    if (!question.quizId) {
      throw new Error('Question quizId is required to save the record.');
    }

    await prisma.question.upsert({
      where: { id: question.id },
      create: mapQuestionToPrismaCreateInput(question),
      update: mapQuestionToPrismaUpdateInput(question),
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.question.delete({ where: { id } });
  }
}
