/**
 * Test fixtures for E2E tests.
 * Provides access to dynamically fetched quiz information.
 */

import * as fs from 'fs';
import * as path from 'path';

const quizInfoFile = 'playwright/.quiz-info.json';

export interface QuizInfo {
  quizId: string;
  joinCode: string;
  fetchedAt: string;
}

/**
 * Gets the quiz info from the setup phase.
 * Falls back to environment variables if the file doesn't exist.
 */
export function getQuizInfo(): QuizInfo {
  // Try to read from file first
  const filePath = path.resolve(process.cwd(), quizInfoFile);

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as QuizInfo;
  }

  // Fallback to environment variables (for backward compatibility)
  const quizId = process.env.TEST_QUIZ_ID;
  const joinCode = process.env.TEST_JOIN_CODE || 'JOIN-KYTX';

  if (!quizId) {
    throw new Error(
      'Quiz info not found. Make sure the quiz.setup.ts ran before tests.\n' +
        `Expected file: ${filePath}\n` +
        'Or set TEST_QUIZ_ID environment variable.'
    );
  }

  return {
    quizId,
    joinCode,
    fetchedAt: 'env-fallback',
  };
}

/**
 * Convenience getters for individual values.
 */
export function getQuizId(): string {
  return getQuizInfo().quizId;
}

export function getJoinCode(): string {
  return getQuizInfo().joinCode;
}
