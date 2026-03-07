/**
 * Global quiz setup for Playwright E2E tests.
 * Fetches the quiz with the known join code (JOIN-KYTX) and stores its ID
 * so all tests can use the correct quiz ID dynamically.
 *
 * This runs AFTER auth.setup.ts and BEFORE all other tests.
 */

import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const quizInfoFile = 'playwright/.quiz-info.json';

setup('fetch quiz info', async ({ request }) => {
  const joinCode = process.env.TEST_JOIN_CODE || 'JOIN-KYTX';

  console.log('[QUIZ SETUP] Fetching quiz with join code:', joinCode);

  // Fetch quiz via the session join endpoint to get quiz ID
  // Note: This endpoint requires both joinCode and playerName, so we create a setup player
  const setupPlayerName = `E2E-Setup-${Date.now()}`;
  const response = await request.post('/api/session/join', {
    data: { joinCode, playerName: setupPlayerName },
  });

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(
      `Failed to find quiz with join code ${joinCode}.\n` +
        `Make sure you've run 'yarn prisma:seed' before running E2E tests.\n` +
        `Response: ${response.status()} ${text}`
    );
  }

  const data = await response.json();
  const quizId = data.quiz?.id || data.quizId;

  if (!quizId) {
    throw new Error(`Quiz ID not found in response: ${JSON.stringify(data)}`);
  }

  console.log('[QUIZ SETUP] Found quiz:', quizId);

  // Store quiz info for other tests
  const quizInfo = {
    quizId,
    joinCode,
    fetchedAt: new Date().toISOString(),
  };

  // Ensure directory exists
  const dir = path.dirname(quizInfoFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(quizInfoFile, JSON.stringify(quizInfo, null, 2));
  console.log('[QUIZ SETUP] Quiz info saved to:', quizInfoFile);
});
