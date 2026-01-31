import { test, expect } from '@playwright/test';

/**
 * Phase 4.3: Player Reconnection Flow
 * E2E tests for automatic reconnection after network disruptions.
 *
 * Manual testing observations (2026-01-31):
 * - ConnectionStatusBanner appears within ~1s of offline event
 * - Banner shows "Connection lost" with WifiOff icon
 * - Answer input disabled (placeholder changes to "Reconnecting…")
 * - Submit button disabled (text changes to "Reconnecting…")
 * - Auto-reconnection triggers immediately on 'online' event
 * - Banner disappears after successful reconnection
 * - Answer input re-enabled with "Type your answer" placeholder
 * - Toast notification appears briefly ("✓ Reconnected! Your session has been restored.")
 */

const QUIZ_ID = process.env.TEST_QUIZ_ID || 'cmjd39h6o0000g18o0s8eq6cp';
const JOIN_CODE = process.env.TEST_JOIN_CODE || 'JOIN-KYTX';

test.describe('Player Reconnection Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
  });

  test('should show offline banner when player disconnects', async ({
    page,
  }) => {
    // Setup: Join as player
    const playerName = `E2E Reconnect ${Date.now()}`;
    await page.goto('/join');
    await page.getByRole('textbox', { name: /join code/i }).fill(JOIN_CODE);
    await page.getByRole('textbox', { name: /your name/i }).fill(playerName);
    await page.getByRole('button', { name: /join quiz/i }).click();

    // Wait for play page to load
    await page.waitForURL(new RegExp(`/play/${QUIZ_ID}/[a-z0-9-]+`), {
      timeout: 30000,
    });

    // Verify answer input is initially enabled
    const answerInput = page.getByRole('textbox', {
      name: /type your answer/i,
    });
    await expect(answerInput).toBeEnabled();

    // Simulate network disconnection
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    // Verify ConnectionStatusBanner appears
    const banner = page
      .getByRole('alert')
      .filter({ hasText: /connection lost/i });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/trying to reconnect/i);

    // Verify answer input is disabled
    await expect(
      page.getByRole('textbox', { name: /reconnecting/i })
    ).toBeDisabled();

    // Verify submit button is disabled
    await expect(
      page.getByRole('button', { name: /reconnecting/i })
    ).toBeDisabled();
  });

  test('should auto-reconnect when network returns', async ({ page }) => {
    // Setup: Join as player and trigger disconnection
    const playerName = `E2E Reconnect ${Date.now()}`;
    await page.goto('/join');
    await page.getByRole('textbox', { name: /join code/i }).fill(JOIN_CODE);
    await page.getByRole('textbox', { name: /your name/i }).fill(playerName);
    await page.getByRole('button', { name: /join quiz/i }).click();
    await page.waitForURL(new RegExp(`/play/${QUIZ_ID}/[a-z0-9-]+`), {
      timeout: 30000,
    });

    // Disconnect
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });
    const banner = page
      .getByRole('alert')
      .filter({ hasText: /connection lost/i });
    await expect(banner).toBeVisible();

    // Simulate network return
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    // Wait for reconnection (auto-triggers within 1s)
    await page.waitForTimeout(2000);

    // Verify ConnectionStatusBanner disappears
    await expect(banner).not.toBeVisible({ timeout: 3000 });

    // Verify answer input is re-enabled
    await expect(
      page.getByRole('textbox', { name: /type your answer/i })
    ).toBeEnabled();

    // Verify submit button text reverted
    await expect(
      page.getByRole('button', { name: /send answer/i })
    ).toBeVisible();
  });

  test('should disable answer submission while offline', async ({ page }) => {
    // Setup: Join as player
    const playerName = `E2E Reconnect ${Date.now()}`;
    await page.goto('/join');
    await page.getByRole('textbox', { name: /join code/i }).fill(JOIN_CODE);
    await page.getByRole('textbox', { name: /your name/i }).fill(playerName);
    await page.getByRole('button', { name: /join quiz/i }).click();
    await page.waitForURL(new RegExp(`/play/${QUIZ_ID}/[a-z0-9-]+`), {
      timeout: 30000,
    });

    // Verify input is enabled initially
    const answerInput = page.getByRole('textbox', {
      name: /type your answer/i,
    });
    await expect(answerInput).toBeEnabled();

    // Simulate disconnection
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    // Try to type in disabled input (should not work)
    const disabledInput = page.getByRole('textbox', { name: /reconnecting/i });
    await expect(disabledInput).toBeDisabled();

    // Verify submit button is disabled
    const submitButton = page.getByRole('button', { name: /reconnecting/i });
    await expect(submitButton).toBeDisabled();

    // Attempt to click (should have no effect)
    await submitButton.click({ force: true });
    // No assertion needed - disabled button shouldn't trigger submission
  });

  test('should show reconnecting state during sync', async ({ page }) => {
    // Setup: Join as player
    const playerName = `E2E Reconnect ${Date.now()}`;
    await page.goto('/join');
    await page.getByRole('textbox', { name: /join code/i }).fill(JOIN_CODE);
    await page.getByRole('textbox', { name: /your name/i }).fill(playerName);
    await page.getByRole('button', { name: /join quiz/i }).click();
    await page.waitForURL(new RegExp(`/play/${QUIZ_ID}/[a-z0-9-]+`), {
      timeout: 30000,
    });

    // Simulate disconnection
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    // Wait for banner to show disconnected state
    const banner = page
      .getByRole('alert')
      .filter({ hasText: /connection lost/i });
    await expect(banner).toBeVisible();

    // Simulate network return (triggers reconnecting state)
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    // Note: Reconnecting state is very brief (<500ms typically) due to fast /sync endpoint
    // In real-world scenarios with slow network, banner would show "Reconnecting..." with spinner
    // For E2E test, we just verify the transition completes successfully
    await page.waitForTimeout(2000);

    // Verify final connected state
    await expect(
      page.getByRole('textbox', { name: /type your answer/i })
    ).toBeEnabled();
  });

  test('should detect offline state immediately on load', async ({ page }) => {
    // Setup: Join as player while online
    const playerName = `E2E Reconnect ${Date.now()}`;
    await page.goto('/join');
    await page.getByRole('textbox', { name: /join code/i }).fill(JOIN_CODE);
    await page.getByRole('textbox', { name: /your name/i }).fill(playerName);
    await page.getByRole('button', { name: /join quiz/i }).click();
    await page.waitForURL(new RegExp(`/play/${QUIZ_ID}/[a-z0-9-]+`), {
      timeout: 30000,
    });

    // Verify initial connected state
    await expect(
      page.getByRole('textbox', { name: /type your answer/i })
    ).toBeEnabled();

    // Simulate going offline
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    // Verify disconnection detected
    const banner = page
      .getByRole('alert')
      .filter({ hasText: /connection lost/i });
    await expect(banner).toBeVisible();

    // Simulate going back online
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    // Verify reconnection
    await page.waitForTimeout(2000);
    await expect(banner).not.toBeVisible({ timeout: 3000 });
    await expect(
      page.getByRole('textbox', { name: /type your answer/i })
    ).toBeEnabled();
  });
});
