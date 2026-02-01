import { test, expect } from '@playwright/test';
import { getQuizId } from './fixtures';

/**
 * E2E test for round transitions (answer locking).
 * Tests the Lock Question flow from host perspective.
 */

test.describe('Round Transitions', () => {
  test.beforeEach(async ({ page }) => {
    const quizId = getQuizId();
    await page.goto(`/quiz/${quizId}`);
  });

  test('should show Lock Question button when quiz is active', async ({
    page,
  }) => {
    // Check if quiz is active (may need to start it first)
    const status = await page
      .getByRole('banner')
      .getByText(/Pending|Active/i)
      .textContent();

    if (status?.includes('Pending')) {
      await page.getByRole('button', { name: /start quiz/i }).click();
      await expect(page.getByRole('banner').getByText(/Active/i)).toBeVisible({
        timeout: 5000,
      });
    }

    // Verify Lock Question button is visible
    await expect(
      page.getByRole('button', { name: /lock question/i })
    ).toBeVisible();
  });

  test('should lock question and show round summary dialog', async ({
    page,
  }) => {
    // Ensure quiz is active
    const status = await page
      .getByRole('banner')
      .getByText(/Pending|Active/i)
      .textContent();

    if (status?.includes('Pending')) {
      await page.getByRole('button', { name: /start quiz/i }).click();
      await expect(page.getByRole('banner').getByText(/Active/i)).toBeVisible({
        timeout: 5000,
      });
    }

    // Click Lock Question
    const lockButton = page.getByRole('button', { name: /lock question/i });
    await expect(lockButton).toBeEnabled();
    await lockButton.click();

    // Wait for Round Summary dialog to appear
    await expect(
      page.getByRole('heading', { name: /round summary/i })
    ).toBeVisible({ timeout: 5000 });

    // Verify dialog content
    await expect(page.getByText(/correct answer/i)).toBeVisible();
    await expect(page.getByText(/players correct/i)).toBeVisible();
    await expect(page.getByText(/average time/i)).toBeVisible();

    // Close dialog
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(
      page.getByRole('heading', { name: /round summary/i })
    ).not.toBeVisible();
  });

  test('should disable Lock Question after locking', async ({ page }) => {
    // Ensure quiz is active
    const status = await page
      .getByRole('banner')
      .getByText(/Pending|Active/i)
      .textContent();

    if (status?.includes('Pending')) {
      await page.getByRole('button', { name: /start quiz/i }).click();
      await expect(page.getByRole('banner').getByText(/Active/i)).toBeVisible({
        timeout: 5000,
      });
    }

    // Lock the question
    const lockButton = page.getByRole('button', { name: /lock question/i });

    // Check if already locked by checking button state
    const isDisabled = await lockButton.isDisabled();

    if (!isDisabled) {
      await lockButton.click();

      // Wait for and close dialog
      await expect(
        page.getByRole('heading', { name: /round summary/i })
      ).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: /continue/i }).click();
    }

    // After locking, button should be disabled until next question
    await expect(lockButton).toBeDisabled();
  });

  test('should re-enable Lock Question after advancing', async ({ page }) => {
    // Ensure quiz is active
    const status = await page
      .getByRole('banner')
      .getByText(/Pending|Active/i)
      .textContent();

    if (status?.includes('Pending')) {
      await page.getByRole('button', { name: /start quiz/i }).click();
      await expect(page.getByRole('banner').getByText(/Active/i)).toBeVisible({
        timeout: 5000,
      });
    }

    const lockButton = page.getByRole('button', { name: /lock question/i });
    const advanceButton = page.getByRole('button', { name: /next question/i });

    // Lock the current question if not already locked
    const isLockDisabled = await lockButton.isDisabled();
    if (!isLockDisabled) {
      await lockButton.click();
      await expect(
        page.getByRole('heading', { name: /round summary/i })
      ).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: /continue/i }).click();
    }

    // Advance to next question
    await advanceButton.click();

    // Wait for new question to load (button should re-enable)
    await expect(lockButton).toBeEnabled({ timeout: 5000 });
  });
});
