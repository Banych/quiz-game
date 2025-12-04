import type { QuizTimerDTO as QuizTimerDTOType } from '@application/dtos/quiz.dto';
import type { IQuizRepository } from '@domain/repositories/quiz-repository';
import { QuizStatus } from '@domain/entities/quiz';

export type ResetQuizTimerInput = {
  quizId: string;
  durationSeconds?: number;
};

export class ResetQuizTimerUseCase {
  constructor(private readonly quizRepository: IQuizRepository) {}

  async execute({
    quizId,
    durationSeconds,
  }: ResetQuizTimerInput): Promise<QuizTimerDTOType> {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) {
      throw new Error(`Quiz with ID ${quizId} not found.`);
    }

    if (quiz.quizStatus !== QuizStatus.Active) {
      throw new Error('Timer can only be controlled while the quiz is active.');
    }

    if (typeof durationSeconds !== 'undefined' && durationSeconds <= 0) {
      throw new Error('Timer duration must be greater than zero.');
    }

    const snapshot = quiz.resetTimer(durationSeconds);

    await this.quizRepository.save(quiz);

    return {
      duration: snapshot.duration,
      remainingSeconds: snapshot.remainingSeconds,
      startTime: snapshot.startTime?.toISOString() ?? null,
      endTime: snapshot.endTime?.toISOString() ?? null,
    };
  }
}
