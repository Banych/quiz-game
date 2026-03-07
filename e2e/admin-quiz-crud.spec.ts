import { test, expect } from '@playwright/test';
import { AdminQuizzesPage } from './pages';

test.describe('Admin Quiz CRUD', () => {
  let quizzesPage: AdminQuizzesPage;

  // Force serial execution to avoid auth conflicts between tests
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    // Create a persistent context with auth state for all tests
    const context = await browser.newContext({
      storageState: 'playwright/.auth/user.json',
    });
    const page = await context.newPage();
    quizzesPage = new AdminQuizzesPage(page);
    await quizzesPage.goto();
  });

  test('should create a new quiz', async () => {
    const title = `E2E Test Quiz ${Date.now()}`;

    // Create quiz using page object
    await quizzesPage.createQuiz({
      title,
      timePerQuestion: 45,
      allowSkipping: true,
    });

    // Verify quiz appears with correct status
    await expect(
      quizzesPage.page.getByRole('cell', { name: title })
    ).toBeVisible({ timeout: 10000 });

    const row = quizzesPage.getQuizRow(title);
    await expect(row.getByText(/pending/i)).toBeVisible();

    // Verify action buttons are visible for Pending quiz
    await expect(row.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(row.getByRole('button', { name: 'Delete' })).toBeVisible();
  });

  test('should update a pending quiz', async () => {
    const originalTitle = `Update Test ${Date.now()}`;
    const updatedTitle = `${originalTitle} - Updated`;

    // Create a quiz to update
    await quizzesPage.createQuiz({ title: originalTitle });

    // Edit the quiz
    await quizzesPage.editQuiz(originalTitle, {
      title: updatedTitle,
      timePerQuestion: 60,
    });

    // Verify updated title appears
    await expect(
      quizzesPage.page.getByRole('cell', { name: updatedTitle })
    ).toBeVisible({ timeout: 10000 });
  });

  test('should delete a pending quiz', async () => {
    const title = `Delete Test ${Date.now()}`;

    // Create a quiz to delete
    await quizzesPage.createQuiz({ title });

    // Delete the quiz
    await quizzesPage.deleteQuiz(title);

    // Verify quiz is removed
    await expect(
      quizzesPage.page.getByRole('cell', { name: title })
    ).not.toBeVisible({ timeout: 10000 });
  });

  test('should not show edit/delete buttons for active quiz', async () => {
    // Find the "Trivia Night Demo" quiz which should be Active
    const activeRow = quizzesPage.getQuizRow('Trivia Night Demo');

    // Verify it exists and has Active status
    await expect(activeRow.getByText(/active/i)).toBeVisible({
      timeout: 10000,
    });

    // Verify no Edit button (only Pending quizzes have Edit buttons)
    await expect(await quizzesPage.hasEditButton('Trivia Night Demo')).toBe(
      false
    );
  });
});
