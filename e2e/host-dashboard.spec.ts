import { test, expect } from '@playwright/test';

/**
 * E2E test for host dashboard.
 * Based on actual MCP-tested behavior.
 */

const QUIZ_ID = process.env.TEST_QUIZ_ID || 'cmjd39h6o0000g18o0s8eq6cp';

test.describe('Host Dashboard', () => {
  test('should display quiz information and controls', async ({ page }) => {
    await page.goto(`/quiz/${QUIZ_ID}`);

    // Verify quiz info
    await expect(
      page.getByRole('heading', { name: /trivia night demo/i })
    ).toBeVisible();
    await expect(page.getByText(/join code.*JOIN-KYTX/i)).toBeVisible();

    // Check quiz status badge (scoped to banner to avoid matching player statuses)
    await expect(
      page.getByRole('banner').getByText(/Pending|Active/i)
    ).toBeVisible();

    // Verify controls are present
    await expect(
      page.getByRole('button', { name: /start quiz|resume quiz/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /snapshot leaderboard/i })
    ).toBeVisible();

    // Verify sections are visible
    await expect(page.getByRole('heading', { name: /timer/i })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /leaderboard/i })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /questions/i })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /players/i })).toBeVisible();

    // Verify questions list (use .first() since question text appears in multiple places)
    await expect(
      page.getByText(/What is the capital of France/i).first()
    ).toBeVisible();
  });

  test('should start quiz and update status', async ({ page }) => {
    await page.goto(`/quiz/${QUIZ_ID}`);

    // Check initial status (scoped to banner to avoid player status matches)
    const initialStatus = await page
      .getByRole('banner')
      .getByText(/Pending|Active/i)
      .textContent();

    // If quiz is pending, start it
    if (initialStatus?.includes('Pending')) {
      await page.getByRole('button', { name: /start quiz/i }).click();

      // Wait for status to change (scoped to banner)
      await expect(page.getByRole('banner').getByText(/Active/i)).toBeVisible({
        timeout: 5000,
      });

      // Verify timer started
      await expect(page.getByText(/\d{2}:\d{2}/)).toBeVisible();

      // Verify controls updated
      await expect(
        page.getByRole('button', { name: /resume quiz/i })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /next question/i })
      ).toBeEnabled();
      await expect(
        page.getByRole('button', { name: /reset timer/i })
      ).toBeEnabled();
    }
  });
});
