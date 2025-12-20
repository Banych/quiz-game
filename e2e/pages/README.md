# Page Object Model (POM) for E2E Tests

## Overview
This directory contains Page Object Model implementations for Playwright E2E tests. Page Objects encapsulate:
- **Locators** (selectors) for page elements
- **Actions** (click, fill, submit methods)
- **Wait conditions** (auth loading, dialog transitions)

## Benefits
- **DRY principle**: Reuse selectors and actions across tests
- **Maintainability**: Update selectors in one place when UI changes
- **Readability**: Tests read like user stories (`quizzesPage.createQuiz()`)
- **Type safety**: Full TypeScript support with autocomplete

## Usage Pattern

```typescript
import { test, expect } from '@playwright/test';
import { AdminQuizzesPage } from './pages';

test('example', async ({ page }) => {
  // Initialize page object
  const quizzesPage = new AdminQuizzesPage(page);

  // Navigate and wait for load
  await quizzesPage.goto();

  // Perform actions
  await quizzesPage.createQuiz({
    title: 'Test Quiz',
    timePerQuestion: 30,
  });

  // Use exposed locators for custom assertions
  await expect(quizzesPage.heading).toBeVisible();
});
```

## Available Page Objects

### AdminQuizzesPage
**Path**: `/admin/quizzes`
**Methods**:
- `goto()` - Navigate and wait for auth
- `createQuiz(options)` - Open dialog, fill form, submit
- `editQuiz(title, updates)` - Find row, open dialog, update, submit
- `deleteQuiz(title)` - Find row, open dialog, confirm
- `hasQuiz(title)` - Check if quiz exists in table
- `getQuizRow(title)` - Get row locator for custom assertions
- `hasEditButton(title)` - Check if edit button visible
- `hasDeleteButton(title)` - Check if delete button visible

**Properties**:
- `logoutButton`, `createQuizButton`, `heading` - Common locators
- `createDialog`, `editDialog`, `deleteDialog` - Dialog locators

### AdminQuizDetailPage
**Path**: `/admin/quizzes/[id]`
**Methods**:
- `goto(quizId)` - Navigate to quiz detail page
- `createMultipleChoiceQuestion(options)` - Create question with options
- `editQuestion(currentText, updates)` - Edit existing question
- `deleteQuestion(questionText)` - Delete question
- `cancelQuestionCreation()` - Open and cancel dialog
- `validateQuestionRequired()` - Test form validation
- `hasQuestion(questionText)` - Check if question exists
- `getQuestionRow(questionText)` - Get row locator
- `getQuestionNumber(questionText)` - Get question #
- `getQuestionType(questionText)` - Get question type
- `isOptionCheckboxEnabled(optionNumber)` - Check checkbox state

**Properties**:
- `addQuestionButton`, `questionsTable` - Common locators
- `createQuestionDialog`, `editQuestionDialog`, `deleteQuestionDialog`

## Adding New Page Objects

1. Create file in `e2e/pages/[PageName].ts`
2. Implement class with:
   ```typescript
   import { Page, Locator, expect } from '@playwright/test';

   export class MyPage {
     readonly page: Page;
     readonly myButton: Locator;

     constructor(page: Page) {
       this.page = page;
       this.myButton = page.getByRole('button', { name: 'My Button' });
     }

     async goto() {
       await this.page.goto('/my-path');
     }

     async performAction() {
       await this.myButton.click();
     }
   }
   ```
3. Export from `e2e/pages/index.ts`
4. Use in tests via `import { MyPage } from './pages'`

## Best Practices

### ✅ DO
- Use role-based selectors when possible (`getByRole`, `getByLabel`)
- Encapsulate wait conditions in methods (`waitForLoad()`)
- Return locators for custom assertions (`getQuizRow()`)
- Use descriptive method names (`createQuiz()` not `create()`)
- Include JSDoc comments for complex methods

### ❌ DON'T
- Hardcode selectors in tests (use page object methods)
- Mix assertions with actions (return data for assertions)
- Create god objects (split by page/feature)
- Expose internal implementation details

## Examples

### Before (Without POM)
```typescript
test('create quiz', async ({ page }) => {
  await page.goto('http://localhost:3000/admin/quizzes');
  await expect(page.getByRole('button', { name: /logout/i }))
    .toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /create quiz/i }).click();
  const dialog = page.getByRole('dialog', { name: 'Create New Quiz' });
  await dialog.getByLabel(/quiz title/i).fill('Test');
  await dialog.getByRole('button', { name: /^create quiz$/i }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('cell', { name: 'Test' })).toBeVisible();
});
```

### After (With POM)
```typescript
test('create quiz', async ({ page }) => {
  const quizzesPage = new AdminQuizzesPage(page);
  await quizzesPage.goto();
  await quizzesPage.createQuiz({ title: 'Test' });
  await expect(page.getByRole('cell', { name: 'Test' })).toBeVisible();
});
```

## Maintenance

When UI changes:
1. Update affected Page Object class
2. Tests automatically use new selectors
3. No need to update individual tests

Example: If "Create Quiz" button changes to "New Quiz":
- Update `AdminQuizzesPage.createQuizButton` selector
- All 4 quiz-crud tests inherit the fix
