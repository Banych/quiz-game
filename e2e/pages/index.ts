/**
 * Page Object Model exports
 *
 * Provides reusable page objects that encapsulate:
 * - Locators (selectors)
 * - Common actions
 * - Wait conditions
 *
 * Usage:
 * ```typescript
 * import { AdminQuizzesPage } from './pages';
 *
 * test('example', async ({ page }) => {
 *   const quizzesPage = new AdminQuizzesPage(page);
 *   await quizzesPage.goto();
 *   await quizzesPage.createQuiz({ title: 'Test Quiz' });
 * });
 * ```
 */

export { AdminQuizzesPage } from './AdminQuizzesPage';
export { AdminQuizDetailPage } from './AdminQuizDetailPage';
