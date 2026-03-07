import { prisma } from '@infrastructure/database/prisma/client';

/**
 * Validates that a player belongs to a specific quiz.
 * Use this before allowing subscription to quiz or player channels.
 */
export const validatePlayerQuizAccess = async (
  playerId: string,
  quizId: string
): Promise<boolean> => {
  try {
    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
        quizId,
      },
      select: {
        id: true,
      },
    });

    return !!player;
  } catch (error) {
    console.error('Failed to validate player quiz access:', error);
    return false;
  }
};

/**
 * Validates that a quiz exists and can be accessed.
 */
export const validateQuizExists = async (quizId: string): Promise<boolean> => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true },
    });

    return !!quiz;
  } catch (error) {
    console.error('Failed to validate quiz exists:', error);
    return false;
  }
};
