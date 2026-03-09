import type { QuestionDTO as QuestionDTOType } from '@application/dtos/question.dto';
import type { QuizTimerDTO as QuizTimerDTOType } from '@application/dtos/quiz.dto';
import { mapQuestionToDTO } from '@application/mappers/quiz-mapper';
import type { IQuizRepository } from '@domain/repositories/quiz-repository';
import type { IAuditLogRepository } from '@domain/repositories/audit-log-repository';
import { AuditLog, AuditEventType } from '@domain/entities/audit-log';
import { randomUUID } from 'crypto';

export type AdvanceQuestionResult = {
  question: QuestionDTOType | null;
  timer: QuizTimerDTOType;
};

export class AdvanceQuestionUseCase {
  constructor(
    private readonly quizRepository: IQuizRepository,
    private readonly auditLogRepository?: IAuditLogRepository
  ) {}

  async execute(quizId: string): Promise<AdvanceQuestionResult> {
    const quizAggregate = await this.quizRepository.findById(quizId);

    if (!quizAggregate) {
      throw new Error(`Quiz with ID ${quizId} not found.`);
    }

    const nextQuestion = quizAggregate.nextQuestion();
    const timerSnapshot = nextQuestion
      ? quizAggregate.resetTimer()
      : quizAggregate.getTimerSnapshot();

    if (!nextQuestion) {
      quizAggregate.endQuiz();
    }

    await this.quizRepository.save(quizAggregate);

    if (this.auditLogRepository) {
      void this.auditLogRepository
        .save(
          new AuditLog(randomUUID(), AuditEventType.QuestionAdvanced, {
            quizId,
            metadata: {
              questionIndex: quizAggregate.currentQuestionIndex,
              questionId: nextQuestion?.id ?? null,
            },
          })
        )
        .catch((error) => {
          console.error(
            'Failed to save audit log for AdvanceQuestionUseCase',
            error
          );
        });
    }

    return {
      question: nextQuestion ? mapQuestionToDTO(nextQuestion) : null,
      timer: {
        duration: timerSnapshot.duration,
        remainingSeconds: timerSnapshot.remainingSeconds,
        startTime: timerSnapshot.startTime?.toISOString() ?? null,
        endTime: timerSnapshot.endTime?.toISOString() ?? null,
      },
    };
  }
}
