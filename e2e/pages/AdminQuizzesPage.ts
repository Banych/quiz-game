import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Admin Quizzes List page
 * Encapsulates selectors and actions for /admin/quizzes
 */
export class AdminQuizzesPage {
  readonly page: Page;

  // Header elements
  readonly logoutButton: Locator;
  readonly dashboardLink: Locator;
  readonly quizzesLink: Locator;

  // Page elements
  readonly heading: Locator;
  readonly createQuizButton: Locator;

  // Dialog elements
  readonly createDialog: Locator;
  readonly editDialog: Locator;
  readonly deleteDialog: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.logoutButton = page.getByRole('button', { name: /logout/i });
    this.dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    this.quizzesLink = page
      .getByRole('banner')
      .getByRole('link', { name: 'Quizzes' });

    // Page
    this.heading = page.getByRole('heading', { name: 'Quizzes' });
    this.createQuizButton = page.getByRole('button', { name: /create quiz/i });

    // Dialogs
    this.createDialog = page.getByRole('dialog', { name: 'Create New Quiz' });
    this.editDialog = page.getByRole('dialog', { name: 'Edit Quiz' });
    this.deleteDialog = page.getByRole('dialog', { name: 'Delete Quiz' });
  }

  /**
   * Navigate to quizzes page and wait for it to load
   */
  async goto() {
    await this.page.goto('http://localhost:3000/admin/quizzes');
    // Wait for URL to confirm we're not redirected to login
    await this.page.waitForURL('**/admin/quizzes', { timeout: 5000 });
    // Wait for network activity to settle before checking for UI elements
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    await this.waitForLoad();
  }

  /**
   * Wait for page to be fully loaded with auth
   */
  async waitForLoad() {
    // Wait for page content to be visible (reduced timeout after networkidle wait)
    await expect(this.createQuizButton).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get a quiz row by title
   */
  getQuizRow(title: string) {
    return this.page.getByRole('row').filter({ hasText: title });
  }

  /**
   * Check if a quiz exists in the table
   */
  async hasQuiz(title: string): Promise<boolean> {
    return await this.page.getByRole('cell', { name: title }).isVisible();
  }

  /**
   * Create a new quiz
   */
  async createQuiz(options: {
    title: string;
    timePerQuestion?: number;
    allowSkipping?: boolean;
  }) {
    // Open create dialog
    await this.createQuizButton.click();
    await expect(this.createDialog).toBeVisible();

    // Fill form
    await this.createDialog.getByLabel(/quiz title/i).fill(options.title);

    if (options.timePerQuestion) {
      await this.createDialog
        .getByLabel(/time per question/i)
        .fill(String(options.timePerQuestion));
    }

    if (options.allowSkipping) {
      await this.createDialog.getByLabel(/allow players to skip/i).check();
    }

    // Submit
    await this.createDialog
      .getByRole('button', { name: /^create quiz$/i })
      .click();

    // Wait for dialog to close
    await expect(this.createDialog).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Edit a quiz
   */
  async editQuiz(
    currentTitle: string,
    updates: {
      title?: string;
      timePerQuestion?: number;
    }
  ) {
    // Find and click edit button
    const row = this.getQuizRow(currentTitle);
    await row.getByRole('button', { name: 'Edit' }).click();

    // Wait for edit dialog
    await expect(this.editDialog).toBeVisible();

    // Update fields
    if (updates.title) {
      const titleInput = this.editDialog.getByLabel(/quiz title/i);
      await titleInput.clear();
      await titleInput.fill(updates.title);
    }

    if (updates.timePerQuestion) {
      await this.editDialog
        .getByLabel(/time per question/i)
        .fill(String(updates.timePerQuestion));
    }

    // Submit
    await this.editDialog.getByRole('button', { name: /save/i }).click();

    // Wait for dialog to close
    await expect(this.editDialog).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Delete a quiz
   */
  async deleteQuiz(title: string) {
    // Find and click delete button
    const row = this.getQuizRow(title);
    await row.getByRole('button', { name: 'Delete' }).click();

    // Confirm deletion
    await expect(this.deleteDialog).toBeVisible();
    await this.deleteDialog
      .getByRole('button', { name: 'Delete Quiz' })
      .click();

    // Wait for dialog to close
    await expect(this.deleteDialog).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Get quiz status badge text
   */
  async getQuizStatus(title: string): Promise<string> {
    const row = this.getQuizRow(title);
    const statusBadge = row.locator('[class*="badge"]').first();
    return (await statusBadge.textContent()) || '';
  }

  /**
   * Check if edit button is visible for a quiz
   */
  async hasEditButton(title: string): Promise<boolean> {
    const row = this.getQuizRow(title);
    return await row.getByRole('button', { name: 'Edit' }).isVisible();
  }

  /**
   * Check if delete button is visible for a quiz
   */
  async hasDeleteButton(title: string): Promise<boolean> {
    const row = this.getQuizRow(title);
    return await row.getByRole('button', { name: 'Delete' }).isVisible();
  }
}
