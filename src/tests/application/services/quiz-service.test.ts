import { QuizService } from '@application/services/quiz-service';
import { StartQuizUseCase } from '@application/use-cases/start-quiz.use-case';
import { EndQuizUseCase } from '@application/use-cases/end-quiz.use-case';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { FindQuizByIdUseCase } from '@application/use-cases/find-quiz-by-id.use-case';
import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';
import { Quiz } from '@domain/entities/quiz';
import { GetQuizStateUseCase } from '@application/use-cases/get-quiz-state.use-case';
import { AdvanceQuestionUseCase } from '@application/use-cases/advance-question.use-case';

type QuizStateDTO = Awaited<ReturnType<GetQuizStateUseCase['execute']>>;
type QuestionDTOResponse = Awaited<
  ReturnType<AdvanceQuestionUseCase['execute']>
>;

describe('QuizService', () => {
  let startQuizUseCase: Mocked<StartQuizUseCase>;
  let endQuizUseCase: Mocked<EndQuizUseCase>;
  let findQuizByIdUseCase: Mocked<FindQuizByIdUseCase>;
  let getQuizStateUseCase: Mocked<GetQuizStateUseCase>;
  let advanceQuestionUseCase: Mocked<AdvanceQuestionUseCase>;
  let quizService: QuizService;

  beforeEach(() => {
    startQuizUseCase = {
      execute: vi.fn(),
    } as unknown as Mocked<StartQuizUseCase>;

    endQuizUseCase = {
      execute: vi.fn(),
    } as unknown as Mocked<EndQuizUseCase>;

    findQuizByIdUseCase = {
      execute: vi.fn(),
    } as unknown as Mocked<FindQuizByIdUseCase>;

    getQuizStateUseCase = {
      execute: vi.fn(),
    } as unknown as Mocked<GetQuizStateUseCase>;

    advanceQuestionUseCase = {
      execute: vi.fn(),
    } as unknown as Mocked<AdvanceQuestionUseCase>;

    quizService = new QuizService(
      startQuizUseCase,
      endQuizUseCase,
      findQuizByIdUseCase,
      getQuizStateUseCase,
      advanceQuestionUseCase
    );
  });

  it('should start a quiz', async () => {
    await quizService.startQuiz('quiz1');
    expect(startQuizUseCase.execute).toHaveBeenCalledWith('quiz1');
  });

  it('should end a quiz and return the leaderboard', async () => {
    const leaderboard = [{ playerId: 'p1', score: 10 }];
    endQuizUseCase.execute.mockResolvedValue(leaderboard);

    const result = await quizService.endQuiz('quiz1');
    expect(endQuizUseCase.execute).toHaveBeenCalledWith('quiz1');
    expect(result).toEqual(leaderboard);
  });

  it('should fetch quiz details', async () => {
    const quizDetails = new QuizSessionAggregate(
      new Quiz('quiz1', 'Quiz 1', [], {
        allowSkipping: true,
        timePerQuestion: 30,
      }),
      60
    );

    findQuizByIdUseCase.execute.mockResolvedValueOnce(quizDetails);

    const result = await quizService.getQuizDetails('quiz1');
    expect(findQuizByIdUseCase.execute).toHaveBeenCalledWith('quiz1');
    expect(result).toEqual(quizDetails);
  });

  it('should throw an error if quiz details are not found', async () => {
    findQuizByIdUseCase.execute.mockRejectedValueOnce(
      new Error(`Quiz with ID quiz1 not found`)
    );

    await expect(quizService.getQuizDetails('quiz1')).rejects.toThrow(
      `Quiz with ID quiz1 not found`
    );
    expect(findQuizByIdUseCase.execute).toHaveBeenCalledWith('quiz1');
  });

  it('returns quiz state DTOs', async () => {
    const dto = {
      id: 'quiz1',
      title: 'Quiz 1',
      status: 'Active',
      currentQuestionIndex: 0,
      settings: { timePerQuestion: 30, allowSkipping: false },
      questions: [],
      players: [],
      answers: undefined,
      leaderboard: [],
      activeQuestionId: null,
      startTime: null,
      endTime: null,
    } as QuizStateDTO;

    getQuizStateUseCase.execute.mockResolvedValue(dto);

    const result = await quizService.getQuizState('quiz1');
    expect(getQuizStateUseCase.execute).toHaveBeenCalledWith('quiz1');
    expect(result).toBe(dto);
  });

  it('advances to the next question', async () => {
    const question = {
      id: 'q2',
      text: 'Q2',
      media: undefined,
      mediaType: undefined,
      options: undefined,
      type: 'multiple-choice',
      points: 10,
    } as QuestionDTOResponse;

    advanceQuestionUseCase.execute.mockResolvedValue(question);

    const result = await quizService.advanceToNextQuestion('quiz1');
    expect(advanceQuestionUseCase.execute).toHaveBeenCalledWith('quiz1');
    expect(result).toEqual(question);
  });
});
