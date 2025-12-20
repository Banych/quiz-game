import { test, expect } from '@playwright/test';

test.describe('Admin Quiz CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:3000/login');

    // Login with admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'banykinv@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'banych1993';

    await page.getByRole('textbox', { name: 'Email' }).fill(adminEmail);
    await page.getByRole('textbox', { name: 'Password' }).fill(adminPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for redirect to admin dashboard
    await expect(page).toHaveURL('http://localhost:3000/admin');

    // Navigate to quizzes page - use exact match to avoid ambiguity
    await page.getByRole('link', { name: 'Quizzes', exact: true }).click();
    await expect(page).toHaveURL('http://localhost:3000/admin/quizzes');
    // Check page heading
    await expect(
      page.getByRole('heading', { name: /^Quizzes$/i })
    ).toBeVisible();

    // Check table exists
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    // Check table headers
    await expect(
      table.getByRole('columnheader', { name: /title/i })
    ).toBeVisible();
    await expect(
      table.getByRole('columnheader', { name: /status/i })
    ).toBeVisible();
    await expect(
      table.getByRole('columnheader', { name: /questions/i })
    ).toBeVisible();
  });

  test('should create a new quiz', async ({ page }) => {
    // Click Create Quiz button
    await page.getByRole('button', { name: /create quiz/i }).click();

    // Wait for dialog to appear
    const dialog = page.getByRole('dialog', { name: /create new quiz/i });
    await expect(dialog).toBeVisible();

    // Fill in the form
    const title = `E2E Test Quiz ${Date.now()}`;
    await dialog.getByLabel(/quiz title/i).fill(title);

    // Set time per question to 45 seconds
    await dialog.getByLabel(/time per question/i).fill('45');

    // Check allow skipping
    await dialog.getByLabel(/allow players to skip/i).check();

    // Submit the form
    await dialog.getByRole('button', { name: /^create quiz$/i }).click();

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // Verify the new quiz appears in the table
    await expect(page.getByRole('cell', { name: title })).toBeVisible({
      timeout: 5000,
    });

    // Verify status is Pending
    const row = page.getByRole('row').filter({ hasText: title });
    await expect(row.getByText(/pending/i)).toBeVisible();

    // Verify Edit and Delete buttons are visible for Pending quiz
    await expect(row.getByRole('button', { name: /edit/i })).toBeVisible();
    await expect(row.getByRole('button', { name: /delete/i })).toBeVisible();
  });

  test('should update a pending quiz', async ({ page }) => {
    // First create a quiz to update
    await page.getByRole('button', { name: /create quiz/i }).click();

    const dialog = page.getByRole('dialog', { name: /create new quiz/i });
    const originalTitle = `Update Test ${Date.now()}`;
    await dialog.getByLabel(/quiz title/i).fill(originalTitle);
    await dialog.getByRole('button', { name: /^create quiz$/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // Wait for quiz to appear
    await expect(page.getByRole('cell', { name: originalTitle })).toBeVisible({
      timeout: 5000,
    });

    // Click Edit button
    const row = page.getByRole('row').filter({ hasText: originalTitle });
    await row.getByRole('button', { name: /edit/i }).click();

    // Wait for edit dialog
    const editDialog = page.getByRole('dialog', { name: /edit quiz/i });
    await expect(editDialog).toBeVisible();

    // Update the title
    const updatedTitle = `${originalTitle} - Updated`;
    const titleInput = editDialog.getByLabel(/quiz title/i);
    await titleInput.clear();
    await titleInput.fill(updatedTitle);

    // Update time per question
    await editDialog.getByLabel(/time per question/i).fill('60');

    // Submit
    await editDialog.getByRole('button', { name: /save changes/i }).click();

    // Wait for dialog to close
    await expect(editDialog).not.toBeVisible({ timeout: 5000 });

    // Verify updated title appears
    await expect(page.getByRole('cell', { name: updatedTitle })).toBeVisible({
      timeout: 5000,
    });
  });

  test('should delete a pending quiz', async ({ page }) => {
    // Create a quiz to delete
    await page.getByRole('button', { name: /create quiz/i }).click();

    const dialog = page.getByRole('dialog', { name: /create new quiz/i });
    const title = `Delete Test ${Date.now()}`;
    await dialog.getByLabel(/quiz title/i).fill(title);
    await dialog.getByRole('button', { name: /^create quiz$/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // Wait for quiz to appear
    await expect(page.getByRole('cell', { name: title })).toBeVisible({
      timeout: 5000,
    });

    // Click Delete button
    const row = page.getByRole('row').filter({ hasText: title });
    await row.getByRole('button', { name: /delete/i }).click();

    // Confirm deletion (if there's a confirmation dialog)
    // Note: This assumes there's a confirmation - adjust if needed
    const confirmDialog = page.getByRole('dialog', { name: /confirm|delete/i });
    if (await confirmDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmDialog
        .getByRole('button', { name: /delete|confirm/i })
        .click();
    }

    // Verify quiz is removed from table
    await expect(page.getByRole('cell', { name: title })).not.toBeVisible({
      timeout: 5000,
    });
  });

  test('should not show edit/delete buttons for active quiz', async ({
    page,
  }) => {
    // Find the "Trivia Night Demo" quiz which should be Active
    const activeRow = page
      .getByRole('row')
      .filter({ hasText: /trivia night demo/i });

    // Verify it exists and has Active status
    await expect(activeRow.getByText(/active/i)).toBeVisible();

    // Verify no Edit or Delete buttons (only Pending/Completed quizzes have these)
    await expect(
      activeRow.getByRole('button', { name: /edit/i })
    ).not.toBeVisible();
    await expect(
      activeRow.getByRole('button', { name: /delete/i })
    ).not.toBeVisible();
  });
});
