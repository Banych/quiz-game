import { test, expect } from '@playwright/test';

/**
 * Phase 4.2: Connection Health & Reconnection
 * Tests presence monitoring, disconnect detection, and host UI indicators
 */
test.describe('Player Connection Status', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as admin to create quiz
    await page.goto('/');
    // TODO: Implement auth flow if not already handled by auth.setup.ts
  });

  test('host sees real-time player connection status', async ({ page }) => {
    // This test verifies:
    // 1. Host dashboard polls /api/quiz/[quizId]/players/status every 5s
    // 2. Player connection badges update based on lastSeenAt
    // 3. Summary counts (connected/away/disconnected) display correctly

    // Step 1: Create a quiz
    // TODO: Navigate to admin panel and create quiz
    // For now, assume quiz exists at /host/quiz/test-quiz-id

    // Step 2: Navigate to host dashboard
    await page.goto('/host/quiz/test-quiz-id');

    // Step 3: Verify PlayerListWithStatus component renders
    await expect(page.getByRole('heading', { name: 'Players' })).toBeVisible();

    // Step 4: Verify empty state
    await expect(page.getByText('No players have joined yet')).toBeVisible();

    // Step 5: Mock API to return players with different statuses
    await page.route('/api/quiz/test-quiz-id/players/status', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            playerId: 'p1',
            name: 'Alice',
            connectionStatus: 'connected',
            lastSeenAt: new Date(Date.now() - 5_000).toISOString(), // 5s ago
          },
          {
            playerId: 'p2',
            name: 'Bob',
            connectionStatus: 'away',
            lastSeenAt: new Date(Date.now() - 60_000).toISOString(), // 60s ago
          },
          {
            playerId: 'p3',
            name: 'Charlie',
            connectionStatus: 'disconnected',
            lastSeenAt: new Date(Date.now() - 150_000).toISOString(), // 150s ago
          },
        ]),
      });
    });

    // Step 6: Wait for first poll (component refetches immediately on mount)
    await page.waitForTimeout(100);

    // Step 7: Verify player cards render
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('Bob')).toBeVisible();
    await expect(page.getByText('Charlie')).toBeVisible();

    // Step 8: Verify connection status badges
    const aliceCard = page.locator('[data-testid="player-card-p1"]').or(
      page.getByText('Alice').locator('..') // Fallback: find parent
    );
    await expect(aliceCard.getByText('Connected')).toBeVisible();

    const bobCard = page
      .locator('[data-testid="player-card-p2"]')
      .or(page.getByText('Bob').locator('..'));
    await expect(bobCard.getByText('Away')).toBeVisible();

    const charlieCard = page
      .locator('[data-testid="player-card-p3"]')
      .or(page.getByText('Charlie').locator('..'));
    await expect(charlieCard.getByText('Disconnected')).toBeVisible();

    // Step 9: Verify summary counts in header
    await expect(page.getByText('1 connected')).toBeVisible();
    await expect(page.getByText('1 away')).toBeVisible();
    await expect(page.getByText('1 disconnected')).toBeVisible();

    // Step 10: Verify last seen timestamps
    await expect(aliceCard.getByText(/5s ago|just now/)).toBeVisible();
    await expect(bobCard.getByText(/1m ago/)).toBeVisible();
    await expect(charlieCard.getByText(/2m ago|3m ago/)).toBeVisible();
  });

  test('player status transitions over time', async ({ page }) => {
    // This test verifies:
    // 1. Player starts as 'connected'
    // 2. After 30s without presence update, status changes to 'away'
    // 3. After 120s without presence update, status changes to 'disconnected'

    await page.goto('/host/quiz/test-quiz-id');

    const mockTime = Date.now();

    // Mock 1: Player is connected (5s ago)
    await page.route('/api/quiz/test-quiz-id/players/status', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            playerId: 'p1',
            name: 'TestPlayer',
            connectionStatus: 'connected',
            lastSeenAt: new Date(mockTime - 5_000).toISOString(),
          },
        ]),
      });
    });

    await page.waitForTimeout(100);
    await expect(page.getByText('TestPlayer')).toBeVisible();
    await expect(page.getByText('Connected')).toBeVisible();

    // Mock 2: Player is now away (60s ago)
    await page.route('/api/quiz/test-quiz-id/players/status', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            playerId: 'p1',
            name: 'TestPlayer',
            connectionStatus: 'away',
            lastSeenAt: new Date(mockTime - 60_000).toISOString(),
          },
        ]),
      });
    });

    // Wait for next poll (5s refetch interval)
    await page.waitForTimeout(5500);
    await expect(page.getByText('Away')).toBeVisible();

    // Mock 3: Player is now disconnected (150s ago)
    await page.route('/api/quiz/test-quiz-id/players/status', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            playerId: 'p1',
            name: 'TestPlayer',
            connectionStatus: 'disconnected',
            lastSeenAt: new Date(mockTime - 150_000).toISOString(),
          },
        ]),
      });
    });

    // Wait for next poll
    await page.waitForTimeout(5500);
    await expect(page.getByText('Disconnected')).toBeVisible();
  });

  test('handles API errors gracefully', async ({ page }) => {
    await page.goto('/host/quiz/test-quiz-id');

    // Mock API error
    await page.route('/api/quiz/test-quiz-id/players/status', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.waitForTimeout(100);

    // Verify error message displays
    await expect(
      page.getByText('Failed to load player connection status')
    ).toBeVisible();
  });

  test('handles quiz not found', async ({ page }) => {
    await page.goto('/host/quiz/nonexistent-quiz-id');

    // Mock 404 response
    await page.route(
      '/api/quiz/nonexistent-quiz-id/players/status',
      (route) => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Quiz not found' }),
        });
      }
    );

    await page.waitForTimeout(100);

    // Verify error state
    await expect(
      page.getByText('Failed to load player connection status')
    ).toBeVisible();
  });
});
