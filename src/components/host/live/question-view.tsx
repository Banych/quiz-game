'use client';

import type { QuizDTO } from '@application/dtos/quiz.dto';
import { TimerCountdown } from '@components/host/timer-countdown';

type Props = { quiz: QuizDTO };

const LABELS = ['A', 'B', 'C', 'D'];

export function QuestionView({ quiz }: Props) {
  const activeQuestion = quiz.questions.find(
    (q) => q.id === quiz.activeQuestionId
  );

  if (!activeQuestion) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-white text-2xl">Loading...</p>
      </div>
    );
  }

  const questionNumber = quiz.currentQuestionIndex + 1;
  const totalQuestions = quiz.questions.length;
  const answeredCount = (quiz.answers?.[quiz.activeQuestionId ?? ''] ?? [])
    .length;
  const totalPlayers = quiz.players.length;

  const showOptions =
    activeQuestion.type === 'multiple-choice' ||
    activeQuestion.type === 'true/false';
  const options =
    activeQuestion.type === 'true/false'
      ? (activeQuestion.options ?? ['True', 'False'])
      : (activeQuestion.options ?? []);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-10 py-6">
        <span className="text-xl font-semibold text-gray-400">
          Q {questionNumber} of {totalQuestions}
        </span>
        <span className="text-lg text-gray-400">
          {answeredCount} / {totalPlayers} answered
        </span>
      </div>

      {/* Timer */}
      <div className="flex justify-center py-4">
        <TimerCountdown
          size="large"
          duration={quiz.timer.duration}
          remainingSeconds={quiz.timer.remainingSeconds}
          startTime={quiz.timer.startTime}
        />
      </div>

      {/* Question text */}
      <div className="flex-1 flex flex-col items-center justify-center px-16 text-center">
        <p className="text-5xl font-bold text-white leading-tight">
          {activeQuestion.text}
        </p>

        {/* Media */}
        {activeQuestion.media && (
          <div className="flex justify-center my-6">
            {activeQuestion.mediaType === 'image' && (
              <img
                src={activeQuestion.media}
                alt="Question media"
                className="max-h-64 rounded-xl object-contain"
              />
            )}
            {activeQuestion.mediaType === 'video' && (
              <video
                src={activeQuestion.media}
                controls
                className="max-h-64 rounded-xl"
              />
            )}
            {activeQuestion.mediaType === 'audio' && (
              <audio src={activeQuestion.media} controls className="w-96" />
            )}
          </div>
        )}
      </div>

      {/* Options or hint */}
      {showOptions ? (
        <div className="grid grid-cols-2 gap-4 px-10 pb-10">
          {options.map((option, i) => (
            <div
              key={i}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 flex items-center gap-4"
            >
              <span className="w-10 h-10 rounded-full bg-gray-700 text-white font-bold text-lg flex items-center justify-center flex-shrink-0">
                {LABELS[i]}
              </span>
              <span className="text-2xl font-semibold text-white">
                {option}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xl text-gray-500 text-center pb-10">
          Players type their answer on their device
        </p>
      )}
    </div>
  );
}
