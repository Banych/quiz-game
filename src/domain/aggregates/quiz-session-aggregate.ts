import { Answer } from '@domain/entities/answer';
import { Quiz, QuizStatus } from '@domain/entities/quiz';
import { LeaderboardScore } from '@domain/types/leaderboard-score';
import { Score } from '@domain/value-objects/score';
import { Timer } from '@domain/value-objects/timer';

export class QuizSessionAggregate {
  quiz: Quiz;
  timer: Timer;
  scores: Map<string, Score>;

  constructor(quiz: Quiz, timerDuration: number) {
    this.quiz = quiz;
    this.timer = new Timer(timerDuration);
    this.scores = new Map();
    this.quiz.players.forEach((player) => {
      this.scores.set(player.id, new Score());
    });
  }

  startQuiz(): void {
    this.quiz.startQuiz();
    this.timer.start();
  }

  endQuiz(): void {
    this.quiz.endQuiz();
  }

  submitAnswer(playerId: string, questionId: string, answer: string): void {
    if (this.quiz.status !== QuizStatus.Active) {
      throw new Error('Quiz is not active.');
    }

    const player = this.quiz.players.find((p) => p.id === playerId);
    const question = this.quiz.questions.find((q) => q.id === questionId);

    if (!player || !question) {
      throw new Error('Invalid player or question.');
    }

    const isCorrect = question.validateAnswer(answer);
    const points = isCorrect ? question.points : 0;

    const playerAnswer = player.answers.get(questionId);
    if (playerAnswer) {
      if (isCorrect) {
        playerAnswer.markCorrect(points);
      } else {
        playerAnswer.markIncorrect();
      }
    } else {
      const newAnswer = new Answer(
        playerId,
        questionId,
        answer,
        new Date(),
        this.timer.getRemainingTime()
      );

      if (isCorrect) {
        newAnswer.markCorrect(points);
      } else {
        newAnswer.markIncorrect();
      }

      player.submitAnswer(questionId, newAnswer);
    }

    if (isCorrect) {
      const playerScore = this.scores.get(playerId);
      playerScore?.add(points);
    }
  }

  getLeaderboard(): LeaderboardScore[] {
    return Array.from(this.scores.entries())
      .map(
        ([playerId, score]): LeaderboardScore => ({
          playerId,
          score: score.value,
        })
      )
      .sort((a, b) => b.score - a.score);
  }
}
