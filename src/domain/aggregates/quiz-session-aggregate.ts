import { Quiz, QuizSettings, QuizStatus } from '@domain/entities/quiz';
import { Timer } from '@domain/value-objects/timer';
import { Answer } from '@domain/entities/answer';
import { LeaderboardScore } from '@domain/types/leaderboard-score';
import { Question } from '@domain/entities/question';

type QuizSessionAggregateOptions = {
  timerStartTime?: Date;
  timerEndTime?: Date;
};

export type TimerSnapshot = {
  duration: number;
  remainingSeconds: number | null;
  startTime?: Date;
  endTime?: Date;
};

export class QuizSessionAggregate {
  private quiz: Quiz;
  private timer: Timer;

  constructor(
    quiz: Quiz,
    timerDuration: number,
    options?: QuizSessionAggregateOptions
  ) {
    this.quiz = quiz;
    this.timer = new Timer(timerDuration, {
      startTime: options?.timerStartTime,
      endTime: options?.timerEndTime,
    });
  }

  get quizId(): string {
    return this.quiz.id;
  }

  get quizTitle(): string {
    return this.quiz.title;
  }

  get quizStatus(): QuizStatus {
    return this.quiz.status;
  }

  get joinCode(): string | undefined {
    return this.quiz.joinCode;
  }

  set joinCode(code: string | undefined) {
    this.quiz.joinCode = code;
  }

  get quizSettings(): QuizSettings {
    return this.quiz.settings;
  }

  get quizQuestions(): Question[] {
    return this.quiz.questions;
  }

  get timerDuration(): number {
    return this.timer.duration;
  }

  get timerStartTime(): Date | undefined {
    return this.timer.startTime;
  }

  get timerEndTime(): Date | undefined {
    return this.timer.endTime;
  }

  get currentQuestion(): Question | null {
    if (this.quiz.status !== QuizStatus.Active) {
      return null;
    }
    return this.quiz.questions[this.quiz.currentQuestionIndex] || null;
  }

  get remainingTime(): number {
    return this.timer.getRemainingTime();
  }

  get answers(): Map<string, Answer[]> {
    return this.quiz.answers;
  }

  get playerIds(): string[] {
    return Array.from(this.quiz.players);
  }

  get startTime(): Date | undefined {
    return this.quiz.startTime;
  }

  get endTime(): Date | undefined {
    return this.quiz.endTime;
  }

  get currentQuestionIndex(): number {
    return this.quiz.currentQuestionIndex;
  }

  get activeQuestionId(): string | null {
    return this.currentQuestion?.id ?? null;
  }

  startQuiz(): void {
    this.quiz.startQuiz();
    this.resetTimer();
  }

  endQuiz(): void {
    this.quiz.endQuiz();
  }

  addPlayer(playerId: string): void {
    this.quiz.addPlayer(playerId);
  }

  removePlayer(playerId: string): void {
    this.quiz.removePlayer(playerId);
  }

  hasPlayer(playerId: string): boolean {
    return this.quiz.players.has(playerId);
  }

  nextQuestion(): Question | null {
    if (this.quiz.status !== QuizStatus.Active) {
      throw new Error('Quiz is not active.');
    }

    return this.quiz.nextQuestion();
  }

  submitAnswer(
    playerId: string,
    questionId: string,
    answerValue: string
  ): Answer {
    if (this.quiz.status !== QuizStatus.Active) {
      throw new Error('Quiz is not active.');
    }

    const question = this.quiz.questions.find((q) => q.id === questionId);
    if (!question) {
      throw new Error('Invalid question.');
    }

    const isCorrect = question.validateAnswer(answerValue);
    const points = isCorrect ? question.points : 0;

    const answer = new Answer(
      crypto.randomUUID(),
      playerId,
      questionId,
      answerValue,
      new Date(),
      this.timer.getRemainingTime()
    );
    if (isCorrect) {
      answer.markCorrect(points);
    } else {
      answer.markIncorrect();
    }

    this.quiz.submitAnswer(playerId, answer);
    return answer;
  }

  getLeaderboard(): LeaderboardScore[] {
    const scores = this.quiz.calculateScores();
    return Array.from(scores.entries())
      .map(([playerId, score]) => ({ playerId, score }))
      .sort((a, b) => b.score - a.score);
  }

  resetTimer(duration?: number, startAt: Date = new Date()): TimerSnapshot {
    const nextDuration = duration ?? this.quiz.settings.timePerQuestion;
    this.timer.restart(nextDuration, startAt);
    return this.getTimerSnapshot();
  }

  getTimerSnapshot(): TimerSnapshot {
    let remainingSeconds: number | null = null;
    if (this.timer.startTime && this.timer.endTime) {
      try {
        remainingSeconds = this.timer.getRemainingTime();
      } catch {
        remainingSeconds = null;
      }
    }

    return {
      duration: this.timer.duration,
      remainingSeconds,
      startTime: this.timer.startTime,
      endTime: this.timer.endTime,
    };
  }
}
